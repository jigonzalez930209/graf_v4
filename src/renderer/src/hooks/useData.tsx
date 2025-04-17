import * as React from 'react'
import _ from 'lodash'

import { GrafContext } from '../context/GraftContext'
import { IProcessFile } from '@shared/models/files'
import { ICsvFileColum, IStepBetweenPoints } from '@shared/models/graf'

type column = {
  name: string
  index: number
  color?: string
  content?: string[]
}

type ReturnGetCSVData =
  | {
      x?: column[]
      y?: column[]
      y2?: column[]
    }
  | undefined

// TODO: refactor this hook in different and more specific hooks to each cain of data
export const useData = () => {
  const {
    graftState,
    setSelectedFile,
    setGraftType,
    setSelectedColumns: setColumns,
    setFiles,
    updateFile,
    updateCSVfileColumn,
    setSelectedFilesCount,
    addFiles
  } = React.useContext(GrafContext)

  const setData = (payload: IProcessFile[]) => {
    setColumns([])
    setSelectedFilesCount(0)
    if (payload?.length > 0) {
      const columns: ICsvFileColum[] = []
      payload.forEach((file) => {
        if (file.type === 'csv') {
          columns.push({
            id: file.id,
            fileName: file.name,
            selected: file.selected,
            notSelected: file?.csv?.columns.map((name, index) => ({
              name,
              index
            })),
            x: [],
            y: [],
            y2: []
          })
        }
      })
      setColumns(columns)
      setFiles(payload)
    } else {
      setFiles([])
    }
  }

  const addFilesToState = (payload: IProcessFile[]) => {
    setColumns([])
    setSelectedFilesCount(0)
    if (payload?.length > 0) {
      const columns: ICsvFileColum[] = []
      payload.forEach((file) => {
        if (file.type === 'csv') {
          columns.push({
            id: file.id,
            fileName: file.name,
            selected: file.selected,
            notSelected: file?.csv?.columns.map((name, index) => ({
              name,
              index
            })),
            x: [],
            y: [],
            y2: []
          })
        }
      })
      setColumns(columns)
      addFiles(payload)
    } else {
      addFiles([])
    }
  }

  const updateFileContent = ({
    id,
    newSelectedIndex,
    fileName
  }: {
    id: string
    fileName: string
    newSelectedIndex: number
  }) => {
    const selectedFile = graftState.files.find((file) => file.id === id) ?? null
    const selectedColumn = graftState.csvFileColum.find((c) => c.fileName === fileName)

    const notSelected = selectedFile?.invariableContent?.[newSelectedIndex].map((val, index) => ({
      name: val,
      index
    }))

    updateFile({
      id,
      name: fileName,
      ...(!!selectedFile && { ...selectedFile }),
      selectedInvariableContentIndex: newSelectedIndex,
      content: _.slice(
        selectedFile?.invariableContent,
        newSelectedIndex + 1,
        selectedFile?.invariableContent?.length
      ),
      csv: { columns: selectedFile?.invariableContent?.[newSelectedIndex] || [] }
    } as IProcessFile)

    updateCSVfileColumn({
      ...(!!selectedColumn && { ...selectedColumn }),
      notSelected,
      x: [],
      y: [],
      y2: []
    } as ICsvFileColum)
  }

  const changeSelectedFile = React.useCallback(
    async (id: string) => {
      const file = graftState.files.find((file) => file.id === id)

      if (!file) throw new Error('File not found')

      if (graftState.selectedFilesCount === 10 && file.selected === false)
        throw new Error('You can select only 10 files')

      if (file.selected) {
        await setSelectedFilesCount(graftState.selectedFilesCount - 1)
      } else {
        await setSelectedFilesCount(graftState.selectedFilesCount + 1)
      }

      if (file.type === 'csv') {
        setSelectedFile('csv')
        setSelectedFilesCount(1)
        setFiles(
          graftState.files.map((file) => ({
            ...file,
            selected: file.id === id
          }))
        )
        setColumns(
          graftState.csvFileColum.map((c) => ({
            ...c,
            selected: c.fileName === file.name
          }))
        )
      } else if (file.type === graftState.fileType) {
        const files = graftState.files.map((f) =>
          f.id === id
            ? {
                ...f,
                selected: f.selected ? false : `${graftState.selectedFilesCount}`
              }
            : {
                ...f,
                selected:
                  parseInt(file.selected.toString()) < parseInt(f.selected.toString())
                    ? `${parseInt(f.selected.toString()) - 1}`
                    : f.selected
              }
        )
        setFiles(files)
      } else {
        setSelectedFile(file.type)
        setFiles(
          graftState.files.map((file) => ({
            ...file,
            selected: file.id === id ? '0' : false
          }))
        )
      }
    },
    [
      graftState.files,
      graftState.selectedFilesCount,
      graftState.fileType,
      graftState.csvFileColum,
      setSelectedFile,
      setSelectedFilesCount,
      setFiles,
      setColumns
    ]
  )

  const cleanSelectionFiles = () => {
    setFiles(
      graftState.files.map((file) => ({
        ...file,
        selected: false
      }))
    )
    setSelectedFilesCount(0)
  }

  const getImpedanceData = () => {
    if (graftState.files === null) {
      return []
    }

    return graftState.files
      .filter((file) => file.selected)
      .sort((a, b) => parseInt(a.selected.toString()) - parseInt(b.selected.toString()))
      .map((file) => ({
        ...file,
        content: file.content.map((c) => [
          parseFloat(c[2]) * Math.cos((parseFloat(c[3]) * Math.PI) / 180),
          -parseFloat(c[2]) * Math.sin((parseFloat(c[3]) * Math.PI) / 180)
        ])
      }))
  }

  const getModuleFace = () => {
    if (graftState.files === null) {
      return null
    }
    const impedanceData = graftState.files
      .filter((file) => file.selected)
      .sort((a, b) => parseInt(a.selected.toString()) - parseInt(b.selected.toString()))
      .map((file) => ({
        ...file,
        content: file.content.map((c) => ({
          module: {
            x: Math.log10(parseFloat(c[1])),
            y: parseFloat(c[2])
          },
          face: {
            x: Math.log10(parseFloat(c[1])),
            y: parseFloat(c[3])
          }
        }))
      }))

    return impedanceData
  }

  // TODO: Fix export data to excel functions and separate in different hooks
  const calculateColumn = (key: string, value: string[], isImpedance: boolean = true) => {
    const calculate = {
      Time: isImpedance ? parseFloat(value[0]) : value[2],
      Frequency: parseFloat(value[1]),
      Module: parseFloat(value[2]),
      Face: parseFloat(value[3]),
      ZR: parseFloat(value[2]) * Math.cos((parseFloat(value[3]) * Math.PI) / 180),
      ZI: -parseFloat(value[2]) * Math.sin((parseFloat(value[3]) * Math.PI) / 180),
      name: '',
      Voltage: value[0],
      Current: value[1]
    }

    return calculate[key]
  }

  const exportImpedanceDataToExcel = (columns: string[]) => {
    if (columns.length > 0) {
      return graftState.files
        ?.filter((f) => f.selected)
        .map((file, i) => {
          return {
            name: file.name,
            value: file.content.map((c) =>
              columns.reduce(
                (acc, curr) => ({
                  ...acc,
                  [`${curr} (${i + 1})`]: calculateColumn(curr, c)
                }),
                {}
              )
            )
          }
        })
    } else {
      return []
    }
  }

  const exportVoltammeterDataToExcel = (columns: string[]) => {
    if (columns.length > 0) {
      return graftState.files
        ?.filter((f) => f.selected)
        .map((file, i) => {
          return {
            name: file.name,
            value: file.content.map((c, j) =>
              columns.reduce(
                (acc, curr) => ({
                  ...acc,
                  [`${curr} (${i + 1})`]: calculateColumn(
                    curr,
                    [
                      ...c,
                      (
                        (((file?.voltammeter?.totalTime as number) * 1000) /
                          (file?.pointNumber as number)) *
                        j
                      ).toString()
                    ],
                    false
                  )
                }),
                {}
              )
            )
          }
        })
    } else {
      return []
    }
  }

  const cleanData = () => {
    setFiles([])
    setColumns([])
    setSelectedFile(null)
    setGraftType('scatter')
  }

  const getVCData = (stepBetweens: IStepBetweenPoints) => {
    if (graftState.files === null) {
      return []
    }
    return graftState.files
      .map((file) => ({ ...file, content: _.dropRight(file.content) }))
      .filter((file) => file.selected)
      .map((file) => ({
        ...file,
        content: file.content.filter((_, i) => i % stepBetweens === 0).map((c) => [c[0], c[1]])
      }))
  }

  const getZIZRvsFrequency = () => {
    if (graftState.files === null) {
      return []
    }
    return graftState.files
      .filter((file) => file.selected)
      .sort((a, b) => parseInt(a.selected.toString()) - parseInt(b.selected.toString()))
      .map((file) => ({
        ...file,
        content: file.content.map((c) => ({
          Zi: {
            x: Math.log10(parseFloat(c[1])),
            y: -parseFloat(c[2]) * Math.sin((parseFloat(c[3]) * Math.PI) / 180)
          },
          Zr: {
            x: Math.log10(parseFloat(c[1])),
            y: parseFloat(c[2]) * Math.cos((parseFloat(c[3]) * Math.PI) / 180)
          }
        }))
      }))
  }

  const getCSVData = (cols: ICsvFileColum | undefined): ReturnGetCSVData => {
    if (graftState.files === null || _.isEmpty(cols)) {
      return undefined
    }
    const csvData = graftState.files
      .filter((file) => file.selected)
      .find((file) => file.type === 'csv')

    // group columns by axis
    const x = cols?.x
    const y = cols?.y
    const y2 = cols?.y2

    if (_.isEmpty(x) && _.isEmpty(y)) return undefined

    if (_.isEmpty(x) && _.isEmpty(y)) return undefined

    const currentData: {
      x?: column[]
      y?: column[]
      y2?: column[]
    } = {
      x: x?.map((c) => ({
        ...c,
        content: csvData?.content.map((d) => d[c.index])
      })),
      y: y?.map((c) => ({
        ...c,
        content: csvData?.content.map((d) => d[c.index])
      })),
      y2:
        y2 &&
        y2?.map((c) => ({
          ...c,
          content: csvData?.content.map((d) => d[c.index])
        }))
    }

    return currentData || undefined
  }

  return {
    data: graftState?.files,
    updateData: setData,
    cleanData,
    changeSelectedFile,
    getImpedanceData,
    getModuleFace,
    exportImpedanceDataToExcel,
    getVCData,
    getZIZRvsFrequency,
    getCSVData,
    exportVoltammeterDataToExcel,
    updateFileContent,
    cleanSelectionFiles,
    addFiles: addFilesToState
  }
}

// import * as React from 'react';
// import _ from 'lodash';
// import { GrafContext } from '../context/GraftContext';
// import { IProcessFile, ICsvFileColum } from '@shared/models'; // Assuming models are correctly imported

// // --- Pure utility functions (could be in a separate utils file) ---
// const calculateZR = (module: number, phase: number): number => module * Math.cos((phase * Math.PI) / 180);
// const calculateZI = (module: number, phase: number): number => -module * Math.sin((phase * Math.PI) / 180);
// const log10 = (val: number): number => Math.log10(val);

// // --- Selector Hook ---
// export const useGrafSelectors = () => {
//     const { graftState } = React.useContext(GrafContext);
//     const { files } = graftState;

//     const selectedFiles = React.useMemo(() => {
//         return files
//             ?.filter((file) => file.selected)
//             .sort((a, b) => parseInt(a.selected.toString()) - parseInt(b.selected.toString())) || [];
//     }, [files]); // Dependency: only files (selection status is part of file object)

//     const impedanceData = React.useMemo(() => {
//         return selectedFiles
//             .filter(file => file.type === 'impedance') // Assuming type property exists
//             .map((file) => ({
//                 ...file,
//                 // TODO: Add stronger types for content elements
//                 content: file.content.map((c) => [
//                     calculateZR(parseFloat(c[2]), parseFloat(c[3])),
//                     calculateZI(parseFloat(c[2]), parseFloat(c[3])),
//                 ]),
//             }));
//     }, [selectedFiles]);

//     const moduleFaceData = React.useMemo(() => {
//          // ... similar memoized calculation using selectedFiles ...
//          // Use log10 utility
//     }, [selectedFiles]);

//     // ... other selectors (getVCData, getZIZRvsFrequency) ...

//     const getCSVData = React.useCallback((cols: ICsvFileColum | undefined): ReturnGetCSVData => {
//         // Find the selected CSV file
//         const csvFile = files?.find(f => f.selected && f.type === 'csv');
//         if (!csvFile || !cols || (_.isEmpty(cols.x) && _.isEmpty(cols.y))) {
//             return undefined;
//         }

//         // ... rest of the logic to map columns to content ...
//         // This might not need memoization if `cols` changes frequently,
//         // but the expensive part (finding the file) is quick.
//     }, [files]); // Depends on all files to find the selected one

//     return {
//         selectedFiles, // Expose the memoized selected files list
//         impedanceData,
//         moduleFaceData,
//         getCSVData,
//         // ... other derived data properties/functions
//     };
// };

// // --- Action Hook (Conceptual) ---
// export const useGrafActions = () => {
//     const {
//         // Get only setters from context
//         setFiles,
//         setColumns,
//         setSelectedFile,
//         // ... other setters
//     } = React.useContext(GrafContext);

//     const setData = React.useCallback((payload: IProcessFile[]) => {
//         // ... logic using setFiles, setColumns ...
//     }, [setFiles, setColumns /* ... */]);

//     const changeSelectedFile = React.useCallback(/* ... complex logic ... */, [/* dependencies */]);

//     // ... other action functions ...

//     return {
//         setData,
//         changeSelectedFile,
//         // ... other actions
//     };
// }
