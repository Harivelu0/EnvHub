import typer
import requests
import json
import sys
import os
from typing import Optional
from rich.console import Console
from rich.table import Table
from pathlib import Path

app = typer.Typer(help="ENVECL - Azure Environment Manager")
console = Console()

CONFIG_DIR = Path.home() / ".envecl"
CONFIG_FILE = CONFIG_DIR / "config.json"

# -----------------------------------------------------------------------------
# INTERNAL CONFIGURATION
# -----------------------------------------------------------------------------
DEFAULT_API_URL = "https://envecl.azurewebsites.net/api"

from azure.identity import DefaultAzureCredential
from azure.core.exceptions import ClientAuthenticationError

def get_auth_headers(api_url):
    """
    Acquire Azure AD Token and return headers.
    """
    # If running against localhost, use anonymous/mock headers for backward compatibility if needed
    if "localhost" in api_url or "127.0.0.1" in api_url:
        # Mock mode or local debug
        return {"x-user-id": "local-dev@aity.dev", "Content-Type": "application/json"}

    console.print("[dim]Acquiring Azure Access Token...[/dim]")
    try:
        config = load_config()
        scope = config.get("scope")
        if not scope:
            # Fallback for management scope if not configured, though likely to fail if Audience check is enforcing app ID
            scope = "https://management.azure.com/.default" 
        
        credential = DefaultAzureCredential()
        token = credential.get_token(scope)
        
        return {
            "Authorization": f"Bearer {token.token}",
            "Content-Type": "application/json"
        }
    except Exception as e:
        console.print(f"[bold red]Authentication Failed:[/bold red] {e}")
        console.print("Run `az login` to authenticate.")
        raise typer.Exit(code=1) 

def load_config():
    if not CONFIG_FILE.exists():
        console.print("[bold yellow]Not configured.[/bold yellow] Run `envecl init` first.")
        raise typer.Exit(code=1)
    try:
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    except:
        console.print("[bold red]Config file corrupted.[/bold red]")
        raise typer.Exit(code=1)

@app.command()
def init(
    scope: str = typer.Option(..., prompt=True, help="App ID URI (e.g. api://<client-id>/.default)"),
    api_url: str = typer.Option(DEFAULT_API_URL, help="Azure Function URL"),
):
    """
    Initialize the CLI configuration with Azure AD.
    """
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    config = {
        "api_url": api_url.rstrip("/"),
        "scope": scope
    }
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2)
    console.print(f"[bold green]Config saved to {CONFIG_FILE}[/bold green]")
    console.print("[dim]Note: You must run 'az login' before using other commands.[/dim]")

@app.command()
def push(
    project: str = typer.Option(..., "--project", "-p", help="Project Name"),
    service: str = typer.Option(..., "--service", "-s", help="Service Name"),
    environment: str = typer.Option(..., "--environment", "--env", "-e", help="Environment (dev/prod)"),
    file_path: Path = typer.Option(Path(".env"), "--file", "-f", help="Path to .env file"),
    reason: str = typer.Option(..., "--reason", "-r", prompt=True, help="Reason for change")
):
    """
    Push a .env file to Azure.
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
    Fetch environment variables from Azure.
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
            console.print(f"[bold red]Error {response.status_code}:[/bold red] {response.text}", file=sys.stderr)

    except Exception as e:
        console.print(f"[bold red]Failed:[/bold red] {e}", file=sys.stderr)

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
