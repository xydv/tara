{ pkgs, lib, config, inputs, ... }:

{
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_22;
    npm.enable = true;
  };

  env = {
    POSTGRES_CONNECTION_STRING = config.secretspec.secrets.POSTGRES_CONNECTION_STRING;
    GOOGLE_API_KEY = config.secretspec.secrets.GOOGLE_API_KEY;
    GOOGLE_GENERATIVE_AI_API_KEY = config.secretspec.secrets.GOOGLE_GENERATIVE_AI_API_KEY;
  };
} 
