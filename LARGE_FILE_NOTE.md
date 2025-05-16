# Handling Large Files

The file `assets/demo.mp4` was previously tracked in this repository but exceeded GitHub's 100MB file size limit. 

This file has been removed from the Git history and should be tracked with Git LFS if needed in the future. 

## If you need to add large media files:

1. Make sure Git LFS is installed: `git lfs install`
2. The `.gitattributes` file is already configured to track `.mp4` files with LFS
3. Add and commit your large files normally: `git add assets/your-large-file.mp4` and `git commit`
4. Push to GitHub: `git push origin main` 