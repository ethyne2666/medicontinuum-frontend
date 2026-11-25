@echo off
cd /d "%~dp0"
for %%D in (medicontinuum-organization\backend medicontinuum-organization\frontend medicontinuum-web) do (
  echo Installing %%D
  pushd %%D
  call npm install
  popd
)
echo Done. Optional demo data: cd medicontinuum-organization\backend ^&^& npm run seed
