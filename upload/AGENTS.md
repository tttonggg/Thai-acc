<!-- Parent: ./AGENTS.md -->
<!-- Generated: 2026-04-17 -->

# upload/

## Purpose
Uploaded image files and assets, including screenshots and user-uploaded content.

## Key Files
| File | Description |
|------|-------------|
| `IMG_1758.png` - `IMG_1769.png` | Uploaded photographs (12 images) |
| `Screenshot_*.png` | Desktop screenshots |
| `pasted_image_*.png` | Pasted image content |
| `analysis_5.json` | Analysis data file |

## For AI Agents

### File Storage
This directory contains user-uploaded files. In production, uploaded files should be stored in object storage (S3/MinIO) rather than the filesystem.

### Upload API
File upload is handled via `/api/upload/*` routes with size and type restrictions configured in the API.

### Cleanup
Old uploaded files can be cleaned up to free disk space. Consider implementing automatic cleanup for files older than a certain threshold.