import * as fs from 'fs'
import * as path from 'path'
import { FileWithRelativePath } from './files'
import { encoding, supportedFileTypesArray } from '@shared/constants'
import { readFile } from 'fs-extra'
import { IFileBinary } from '@shared/models/files'
import { fileType } from './utils'

export async function walkDirectoryWithFiles(
  rootDir: string,
  currentDir = ''
): Promise<FileWithRelativePath[]> {
  const fullPath = path.join(rootDir, currentDir)
  const entries = fs.readdirSync(fullPath, { withFileTypes: true })
  let files: FileWithRelativePath[] = []

  for (const entry of entries) {
    const entryPath = path.join(currentDir, entry.name)
    const absolutePath = path.join(rootDir, entryPath)
    if (entry.isDirectory()) {
      const subFiles = await walkDirectoryWithFiles(rootDir, entryPath)
      files = files.concat(subFiles)
    } else {
      const type = fileType(entry.name)
      if (supportedFileTypesArray.includes(type as IFileBinary['type'])) {
        const file = await readFile(absolutePath, { encoding })
        files.push({
          name: entry.name,
          type: type as IFileBinary['type'],
          content: file,
          relativePath: path.normalize(entryPath).split(path.sep).join('/')
        })
      }
    }
  }
  return files
}
