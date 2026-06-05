{ pkgs, lib, config, inputs, ... }:

{
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_22;
    npm.enable = true;
  };

  env = {
    POSTGRES_CONNECTION_STRING = config.secretspec.secrets.POSTGRES_CONNECTION_STRING;
    MISTRAL_API_KEY = config.secretspec.secrets.MISTRAL_API_KEY;
  };
} 
