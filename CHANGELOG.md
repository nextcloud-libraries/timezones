# Changelog

## 1.0.0 - 2025-08-25
### Breaking changes
The format of `zones.json` received a major overhaul.
Please adjust your code accordingly if you import or parse `zones.json`.
1. The aliases object is now mapping each alias directly to the actual time zone name (instead of
   having a nested `aliasTo` key).
2. Time zone coordinates (latitude and longitude) are not included anymore.
### Features
- Optimize alias format in zones.json (BREAKING!)
### Fixes
- Update and fix update-zones.py
- Update timezones data
- Update vulnerable dependencies

## 0.2.0 - 2025-04-22
## Features
- Migrate code to Typescript
## Fixes
- Update vulnerable dependencies

## 0.1.1 - 2024-06-03
### Changed
- Ship a cjs bundle

## 0.1.0 - 2024-06-03
Initial release
