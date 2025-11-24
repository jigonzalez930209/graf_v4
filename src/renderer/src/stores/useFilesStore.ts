import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { IProcessFile } from '@shared/models/files'
import { ICsvFileColum } from '@shared/models/graf'

interface FilesState {
  // State
  files: IProcessFile[]
  csvFileColum: ICsvFileColum[]
  selectedFilesCount: number
  isFilesGrouped: boolean

  // Actions
  setFiles: (files: IProcessFile[]) => void
  setFile: (file: IProcessFile) => void
  addFiles: (files: IProcessFile[]) => void
  updateFile: (file: IProcessFile) => void
  removeFile: (fileId: string) => void
  clearFiles: () => void
  setSelectedColumns: (columns: ICsvFileColum[]) => void
  updateCSVfileColumn: (csvFileColum: ICsvFileColum) => void
  setSelectedFilesCount: (count: number) => void
  setIsFilesGrouped: (isGrouped: boolean) => void
}

export const useFilesStore = create<FilesState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        files: [],
        csvFileColum: [],
        selectedFilesCount: 0,
        isFilesGrouped: false,

        // Actions
        setFiles: (files) => set({ files }, false, 'files/setFiles'),
        setFile: (file) =>
          set((state) => ({ files: [...state.files, file] }), false, 'files/setFile'),
        addFiles: (newFiles) =>
          set((state) => ({ files: [...state.files, ...newFiles] }), false, 'files/addFiles'),

        updateFile: (updatedFile) =>
          set(
            (state) => ({
              files: state.files.map((file) => (file.id === updatedFile.id ? updatedFile : file))
            }),
            false,
            'files/updateFile'
          ),

        removeFile: (fileId) =>
          set(
            (state) => ({
              files: state.files.filter((file) => file.id !== fileId)
            }),
            false,
            'files/removeFile'
          ),

        clearFiles: () =>
          set({ files: [], csvFileColum: [], selectedFilesCount: 0 }, false, 'files/clearFiles'),

        setSelectedColumns: (columns) =>
          set({ csvFileColum: columns }, false, 'files/setSelectedColumns'),

        updateCSVfileColumn: (updatedColumn) =>
          set(
            (state) => ({
              csvFileColum: state.csvFileColum.map((column) =>
                column.id === updatedColumn.id ? updatedColumn : column
              )
            }),
            false,
            'files/updateCSVfileColumn'
          ),

        setSelectedFilesCount: (count) =>
          set({ selectedFilesCount: count }, false, 'files/setSelectedFilesCount'),

        setIsFilesGrouped: (isGrouped) =>
          set({ isFilesGrouped: isGrouped }, false, 'files/setIsFilesGrouped')
      }),
      {
        name: 'files-storage',
        // Solo persistimos configuraciones ligeras, NO los archivos completos
        partialize: (state) => ({
          isFilesGrouped: state.isFilesGrouped
        })
      }
    ),
    { name: 'FilesStore' }
  )
)
