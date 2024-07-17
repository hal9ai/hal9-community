from hal9.targets.docker import deploy as deploy_docker
from hal9.targets.hal9 import deploy as deploy_hal9

targets = {
  'docker': deploy_docker,
  'hal9': deploy_hal9,
}

def deploy(path :str, target :str, url :str, name :str, typename :str, data :str) -> str:
  """Deploy an application

  Parameters
  ----------
  path : str 
          Path to the application.
  target : str 
          The deployment target, defaults to 'hal9.com'.
  name : str 
          The deployment name, automatically generated by default.
  typename : str
          The deployment type, defaults to (chatbot) ability.
  data : str
          The data schema to use, defaults to empty.
  """

  if target in targets:
    targets[target](path, url, name, typename, data)
  else:
    raise Exception(f"Deployment target '{target}' is unsupported.")
