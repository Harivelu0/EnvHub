from setuptools import setup, find_packages

setup(
    name="envhub-cli",
    version="2.0.2",
    packages=find_packages(),
    install_requires=[
        "typer>=0.9.0",
        "requests",
        "python-dotenv",
        "rich",
        "azure-identity>=1.15.0"
    ],
    entry_points={
        "console_scripts": [
            "envhub=main:app",
        ],
    },
    py_modules=["main"],
)
