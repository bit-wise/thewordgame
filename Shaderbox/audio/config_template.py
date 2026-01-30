import os
import sys

# Ensure the repository root (parent directory of this file) is on sys.path
# so we can import modules placed at the project root (e.g. ConfigTemp.py).
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ConfigTemp import ConfigTemplate

if __name__ == "__main__":
    repository = os.path.basename(os.getcwd())
    project = __file__.split('/')[-2]
    ct = ConfigTemplate(repository, project)
    ct.save_config()
