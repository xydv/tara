{ pkgs, lib, config, inputs, ... }:

{
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_22;
    npm.enable = true;
  };

  packages = with pkgs; [
    postgresql_16
  ];


  services.postgres = {
    enable = true;
    package = pkgs.postgresql_16;

    initialDatabases = [
      { name = "provue_tara"; }
    ];

    initialScript = ''
      ALTER USER postgres PASSWORD 'postgres';
    '';
  };

  env = {
    DATABASE_URL = "postgres://postgres:postgres@localhost:5432/provue_tara";
  };

  enterShell = ''
    echo "node: $(node --version)"
    echo "npm:  $(npm --version)"
    echo "postgres ready"
    echo "$DATABASE_URL"
  '';
}
