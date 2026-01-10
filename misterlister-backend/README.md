# Upload
- `dotnet publish -c Release -r linux-x64 --self-contained`
- `wsl -d Ubuntu rsync -avz ./MisterLister/bin/Release/net8.0/linux-x64/publish/ root@91.99.173.216:/home/root/misterlister/`
- `chmod +x /home/root/misterlister/publish/MisterLister`
