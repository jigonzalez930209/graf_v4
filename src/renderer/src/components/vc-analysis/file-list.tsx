import React from 'react'
import FolderView from '../file-sort/folder-view'
import { IProcessFile } from '@shared/models/files'

interface FileListProps {
  files: IProcessFile[]
  onSelect: (id: string, action?: 'selected' | 'deselected') => void
}

/**
 * Renders a selectable list of files for analysis.
 */
export const FileList: React.FC<FileListProps> = ({ files, onSelect }) => {
  return (
    <div className="flex flex-col gap-2 h-full overflow-y-auto overflow-x-hidden">
      <FolderView files={files} setFile={onSelect} />
    </div>
  )
}
