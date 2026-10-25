FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY mt5-bridge.csproj ./
RUN dotnet restore
COPY . ./
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENV MT5_BRIDGE_PORT=5055
EXPOSE 5055
ENTRYPOINT ["dotnet", "mt5-bridge.dll"]
