import typer
import requests
import json
import sys
import os
from typing import Optional
from rich.console import Console
from rich.table import Table
from pathlib import Path

app = typer.Typer(help="EnvHub CLI - Secure Environment Management")
console = Console()

CONFIG_DIR = Path.home() / ".envhub"
CONFIG_FILE = CONFIG_DIR / "config.json"

import subprocess

def get_auth_headers(api_url):
    """
    Acquire GitHub Token from `gh` CLI.
    """
    try:
        # Try `gh auth token` (newer versions)
        result = subprocess.run(["gh", "auth", "token"], capture_output=True, text=True)
        
        if result.returncode == 0:
            token = result.stdout.strip()
        else:
            # Fallback for older gh versions (like 2.4.0)
            # Try `gh auth status -t` and parse stderr/stdout
            # Older versions often print token to stderr with -t
            res_status = subprocess.run(["gh", "auth", "status", "-t"], capture_output=True, text=True)
            output = res_status.stdout + res_status.stderr
            import re
            match = re.search(r"Token: (gh[a-zA-Z0-9_]+)", output)
            if match:
                token = match.group(1)
            else:
                # Last ditch: check if 'gh auth token' failed because not logged in
                console.print("[bold yellow]Could not find GitHub token.[/bold yellow]")
                console.print(f"Debug: {result.stderr}")
                raise typer.Exit(code=1)

        if not token:
             console.print("[bold red]No GitHub token found.[/bold red]")
             console.print("Run `gh auth login` first.")
             raise typer.Exit(code=1)

        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    except FileNotFoundError:
        console.print("[bold red]GitHub CLI (`gh`) not installed.[/bold red]")
        console.print("Please install `gh` to use Envecl.")
        raise typer.Exit(code=1)
    except Exception as e:
        console.print(f"[bold red]Auth Error:[/bold red] {e}")
        raise typer.Exit(code=1) 

def load_config():
    if not CONFIG_FILE.exists():
        console.print("[bold yellow]Not configured.[/bold yellow] Run `envhub init` first.")
        raise typer.Exit(code=1)
    try:
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    except:
        console.print("[bold red]Config file corrupted.[/bold red]")
        raise typer.Exit(code=1)

@app.command()
def login():
    """
    Authenticate with GitHub (via `gh` CLI).
    """
    console.print("[dim]Checking GitHub CLI...[/dim]")
    try:
        # Check if gh is installed / verify status
        subprocess.run(["gh", "--version"], stdout=subprocess.DEVNULL, check=True)
        
        console.print("[bold cyan]EnvHub uses your GitHub identity.[/bold cyan]")
        console.print("Launching `gh auth login`...")
        subprocess.run(["gh", "auth", "login"], check=True)
        
        console.print("[bold green]Auhtentication successful![/bold green]")
        console.print("You can now use `envhub push` and `envhub pull`.")
        
    except FileNotFoundError:
        console.print("[bold red]GitHub CLI (`gh`) not installed.[/bold red]")
        console.print("Please install it: https://cli.github.com/")
        raise typer.Exit(code=1)
    except subprocess.CalledProcessError:
        console.print("[bold red]Login failed.[/bold red]")
        raise typer.Exit(code=1)

@app.command()
def init(
    api_url: str = typer.Option("http://localhost:3000/api", help="EnvHub API URL"),
):
    """
    Initialize the CLI configuration.
    """
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    config = {
        "api_url": api_url.rstrip("/"),
    }
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2)
    console.print(f"[bold green]Config saved to {CONFIG_FILE}[/bold green]")
    console.print("[dim]Note: You must run 'gh auth login' before using other commands.[/dim]")

@app.command()
def push(
    project: str = typer.Option(..., "--project", "-p", help="Project Name"),
    service: str = typer.Option(..., "--service", "-s", help="Service Name"),
    environment: str = typer.Option(..., "--environment", "--env", "-e", help="Environment (dev/prod)"),
    file_path: Path = typer.Option(Path(".env"), "--file", "-f", help="Path to .env file"),
    reason: str = typer.Option(..., "--reason", "-r", prompt=True, help="Reason for change")
):
    """
    Push a .env file to EnvHub.
    """
    config = load_config()
    api_url = config["api_url"]
    headers = get_auth_headers(api_url)

    if not file_path.exists():
        console.print(f"[bold red]File {file_path} not found.[/bold red]")
        raise typer.Exit(code=1)

    # Parse .env file
    variables = {}
    try:
        with open(file_path, "r") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"): continue
                if "=" in line:
                    key, val = line.split("=", 1)
                    variables[key.strip()] = val.strip()
    except Exception as e:
        console.print(f"[bold red]Failed to parse .env file:[/bold red] {e}")
        raise typer.Exit(code=1)

    payload = {
        "project": project,
        "service": service,
        "environment": environment,
        "variables": variables,
        "change_reason": reason
    }

    try:
        response = requests.post(f"{api_url}/push", json=payload, headers=headers)
        
        if response.status_code == 200:
            console.print(f"[bold green]Success![/bold green] Version {response.json().get('version')} deployed.")
        else:
            console.print(f"[bold red]Error {response.status_code}:[/bold red] {response.text}")

    except Exception as e:
        console.print(f"[bold red]Failed:[/bold red] {e}")

@app.command()
def pull(
    project: str = typer.Option(..., "--project", "-p", help="Project Name"),
    service: str = typer.Option(..., "--service", "-s", help="Service Name"),
    environment: str = typer.Option(..., "--environment", "--env", "-e", help="Environment (dev/prod)"),
    version: Optional[int] = typer.Option(None, "--version", "-v"),
    output: Optional[Path] = typer.Option(None, "--output", "-o", help="Save to file instead of stdout")
):
    """
    Fetch environment variables from EnvHub.
    """
    config = load_config()
    api_url = config["api_url"]
    headers = get_auth_headers(api_url)
    
    params = {
        "project": project,
        "service": service,
        "environment": environment
    }
    if version: params["version"] = version

    try:
        response = requests.get(f"{api_url}/pull", params=params, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            variables = data.get("variables", {})
            
            # Generate .env content
            env_content = ""
            for key, value in variables.items():
                env_content += f"{key}={value}\n"
            
            if output:
                with open(output, "w") as f:
                    f.write(env_content)
                console.print(f"[bold green]Saved to {output}[/bold green]")
            else:
                # Print to stdout without extra newlines for piping
                print(env_content, end="")
        else:
            console.print(f"[bold red]Error {response.status_code}:[/bold red] {response.text}")

    except Exception as e:
        console.print(f"[bold red]Failed:[/bold red] {e}")

@app.command()
def history(
    project: str = typer.Option(..., "--project", "-p", help="Project Name"),
    service: str = typer.Option(..., "--service", "-s", help="Service Name"),
    environment: str = typer.Option(..., "--environment", "--env", "-e", help="Environment (dev/prod)"),
):
    """
    List version history.
    """
    config = load_config()
    api_url = config["api_url"]
    headers = get_auth_headers(api_url)
    
    params = {
        "project": project,
        "service": service,
        "environment": environment
    }

    try:
        response = requests.get(f"{api_url}/history", params=params, headers=headers)
        
        if response.status_code == 200:
             data = response.json()
             if "history" not in data:
                 console.print("No history found.")
                 return

             table = Table(title=f"History: {project}/{service}/{environment}")
             table.add_column("Version", justify="right", style="cyan")
             table.add_column("Date", style="green")
             table.add_column("User", style="magenta")
             table.add_column("Reason", style="white")

             for item in data["history"]:
                 table.add_row(
                     str(item["version"]), 
                     item["created_at"],
                     item["created_by"],
                     item["change_reason"]
                 )
             console.print(table)
        else:
            console.print(f"[bold red]Error {response.status_code}:[/bold red] {response.text}")

    except Exception as e:
        console.print(f"[bold red]Failed:[/bold red] {e}")

if __name__ == "__main__":
    app()
