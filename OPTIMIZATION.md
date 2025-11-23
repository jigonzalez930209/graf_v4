# Graf V4 Application Optimization Recommendations

This document outlines key optimization points to improve the application's load time and overall performance.

## Optimization Points

### 1. WebAssembly Module Lazy Loading

**Problem:** The WebAssembly module (`math-lib`) is initialized on component mount regardless of whether its functions are needed immediately.

**Solution:** Implement lazy loading of the WebAssembly module only when math functions are actually needed.

**Complexity:** Medium

**Impact:** High - Reduces initial load time significantly

```typescript
// Current implementation
useEffect(() => {
  init().then((wasmModule) => {
    wasmModule.set_panic_hook()
    setWasm(wasmModule)
  })
}, [])

// Recommended implementation
const loadWasm = useCallback(async () => {
  if (!wasm) {
    const wasmModule = await init()
    wasmModule.set_panic_hook()
    setWasm(wasmModule)
  }
  return wasm
}, [wasm])
```

### 2. Algorithm Optimization in Savitzky-Golay Functions

**Problem:** The Savitzky-Golay implementations in both Rust and TypeScript perform redundant matrix operations for each data point.

**Solution:** Pre-compute and cache filter coefficients for common window sizes and polynomial orders.

**Complexity:** Medium

**Impact:** High - Improves computation time for large datasets

```rust
// Create a coefficient cache in Rust implementation
use std::collections::HashMap;
use std::sync::Mutex;
use once_cell::sync::Lazy;

static COEFFICIENT_CACHE: Lazy<Mutex<HashMap<(usize, usize), Vec<f64>>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));
```

### 3. Memoization of React Component Renders

**Problem:** Components re-render frequently even when their props haven't changed.

**Solution:** Implement React.memo, useMemo, and useCallback more extensively.

**Complexity:** Low

**Impact:** Medium - Reduces unnecessary re-renders

```typescript
// For example in derivate-tab.tsx
const DerivateTab = React.memo(() => {
  // Component implementation
})
```

### 4. Chunked Data Processing

**Problem:** Large datasets are processed all at once, causing UI freezes.

**Solution:** Process large datasets in chunks with a queuing system.

**Complexity:** Medium

**Impact:** High - Prevents UI freezes during heavy calculations

```typescript
function processInChunks(data, chunkSize, processFn) {
  return new Promise((resolve) => {
    const result = []
    let index = 0

    function nextChunk() {
      const chunk = data.slice(index, index + chunkSize)
      index += chunkSize

      if (chunk.length > 0) {
        const processedChunk = processFn(chunk)
        result.push(...processedChunk)
        setTimeout(nextChunk, 0) // Allow UI to update between chunks
      } else {
        resolve(result)
      }
    }

    nextChunk()
  })
}
```

### 5. Web Worker for Math Operations

**Problem:** Heavy mathematical operations block the main thread.

**Solution:** Move intensive calculations to Web Workers.

**Complexity:** Medium

**Impact:** High - Keeps UI responsive during calculations

```typescript
// Create a worker
const mathWorker = new Worker(new URL('./mathWorker.ts', import.meta.url))

// Send tasks to worker
mathWorker.postMessage({ task: 'savitzkyGolayDerivative', data, windowSize, polyOrder })

// Receive results
mathWorker.onmessage = (e) => {
  setResults(e.data.results)
}
```

### 6. Static Analysis and Tree-Shaking Optimization

**Problem:** The application may include unused code and dependencies.

**Solution:** Implement proper tree-shaking and code splitting.

**Complexity:** Medium

**Impact:** Medium - Reduces bundle size

```javascript
// In electron.vite.config.ts
export default defineConfig({
  build: {
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Define manual chunks for better code splitting
          mathjs: ['mathjs'],
          plotly: ['plotly.js-dist', 'react-plotly.js'],
          ui: ['@radix-ui/react-icons', '@radix-ui/react-dialog']
        }
      }
    }
  }
})
```

### 7. Data Structure Optimization

**Problem:** Using Decimal.js for all operations adds significant overhead.

**Solution:** Use native JavaScript numbers for initial calculations and Decimal only when high precision is required.

**Complexity:** Medium

**Impact:** High - Improves computational performance

```typescript
// Use a hybrid approach - native numbers for speed, Decimal for precision when needed
function optimizedCalculation(data) {
  // Fast path with native numbers
  const fastResults = data.map(([x, y]) => [
    Number(x)
    // Fast calculation with native numbers
  ])

  // Convert critical results to Decimal for precision
  return fastResults.map(([x, y]) => [new Decimal(x), new Decimal(y)])
}
```

### 8. Virtualized Rendering for Large Datasets

**Problem:** Rendering all data points simultaneously causes performance issues.

**Solution:** Implement virtualization for charts and tables to only render visible items.

**Complexity:** Medium

**Impact:** High - Significantly improves rendering performance

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedTable({ data }) {
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
  });

  // Only render visible rows
  return (
    <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div key={virtualRow.key} style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualRow.start}px)`,
          }}>
            {data[virtualRow.index].content}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 9. WASM Memory Management Optimization

**Problem:** The current WASM implementation may suffer from inefficient memory management.

**Solution:** Optimize memory allocation and minimize memory copies between JavaScript and Rust.

**Complexity:** High

**Impact:** Medium - Improves performance of WebAssembly functions

```rust
// Instead of creating new Float64Array for results, work directly with memory
#[wasm_bindgen]
pub fn optimized_process(input_ptr: *const f64, input_len: usize, output_ptr: *mut f64) {
    let input_slice = unsafe { std::slice::from_raw_parts(input_ptr, input_len) };
    let output_slice = unsafe { std::slice::from_raw_parts_mut(output_ptr, input_len) };

    // Process data directly into output slice
    for i in 0..input_len {
        output_slice[i] = process_value(input_slice[i]);
    }
}
```

### 10. Caching and State Management Optimization

**Problem:** Repeated calculations for the same inputs waste computation time.

**Solution:** Implement a proper caching mechanism for computation results.

**Complexity:** Low

**Impact:** Medium - Avoids redundant calculations

```typescript
// Create a memoized version of expensive functions
import { memoize } from 'lodash'

const memoizedDerivative = memoize(
  (operation, data, windowSize, polyOrder) => {
    return derivate(operation, data, windowSize, polyOrder)
  },
  (...args) => JSON.stringify(args)
)
```

## Implementation Plan

1. **Quick Wins** (1-2 days)
   - Implement React.memo for components
   - Add lodash memoization for expensive functions
   - Apply proper code splitting in the build configuration

2. **Medium-Term Improvements** (3-5 days)
   - Implement lazy loading for the WASM module
   - Create a Web Worker for math operations
   - Add virtualization for large datasets

3. **Long-Term Optimizations** (1-2 weeks)
   - Optimize Rust algorithms with coefficient caching
   - Refine data structures for better performance
   - Implement chunked processing for large datasets
   - Optimize WASM memory management

## Expected Results

By implementing these optimizations, we expect to see:

- **30-50% reduction** in initial application load time
- **2-3x improvement** in processing speed for large datasets
- **Smoother UI** with fewer freezes during mathematical operations
- **Lower memory consumption** for large datasets

## Monitoring and Validation

To validate the effectiveness of these optimizations:

1. Implement performance monitoring with browser DevTools
2. Add timing metrics for key operations
3. Compare memory usage before and after optimizations
4. Test with various dataset sizes to ensure consistent performance improvements

## Frontend Component Optimizations

### 11. Global State Management Optimization

**Problem:** The current approach in `useData` hook and `GraftContext` creates unnecessary re-renders and has complex, deeply nested state.

**Solution:** Implement a more efficient state management approach using context splitting or a state management library.

**Complexity:** Medium

**Impact:** High - Reduces unnecessary re-renders and improves responsiveness

```typescript
// Split the monolithic context into smaller, focused contexts
// For example, create separate contexts for:

// 1. FileContext for file management
export const FileContext = React.createContext<FileContextProps>({} as FileContextProps)

// 2. PlotContext for plotting configuration
export const PlotContext = React.createContext<PlotContextProps>({} as PlotContextProps)

// 3. OperationsContext for math operations
export const OperationsContext = React.createContext<OperationsContextProps>(
  {} as OperationsContextProps
)
```

### 12. Optimized Plot Rendering

**Problem:** The PlotlyChart component in `plot.tsx` re-renders unnecessarily and performs expensive operations during each render.

**Solution:** Implement advanced memoization and lazy initialization for Plotly charts.

**Complexity:** Medium

**Impact:** High - Significantly improves chart rendering performance

```typescript
// Memoize the Plotly component with custom comparison
const MemoizedPlotly = React.memo(
  (props: PlotParams) => <Plotly {...props} />,
  (prevProps, nextProps) => {
    // Custom deep comparison for plot data
    return isEqual(prevProps.data, nextProps.data) &&
           isEqual(prevProps.layout, nextProps.layout);
  }
);

// Also implement useCallback for event handlers
const handlePlotUpdate = useCallback((figure, graphDiv) => {
  plotDivRef.current = graphDiv;
}, []);
```

### 13. Data Transformation Pipeline Optimization

**Problem:** Data transformations in `useData` are performed synchronously and block the main thread.

**Solution:** Implement a data transformation pipeline that processes data asynchronously.

**Complexity:** Medium

**Impact:** High - Keeps UI responsive during data processing

```typescript
async function processDataPipeline(rawData, operations = []) {
  // Create a processing queue
  const queue = new PQueue({ concurrency: 1 })

  // Add each operation to the queue
  let processedData = rawData
  for (const operation of operations) {
    processedData = await queue.add(() => operation(processedData))

    // Yield to main thread occasionally
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  return processedData
}
```

### 14. Conditional Rendering Optimization

**Problem:** Components in various tabs render regardless of visibility, consuming resources.

**Solution:** Implement proper conditional rendering and lazy loading for tab components.

**Complexity:** Low

**Impact:** Medium - Reduces initial load time and memory usage

```typescript
// In tab components like derivate-tab.tsx
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// In render function
{isTabActive && (
  <Suspense fallback={<div>Loading...</div>}>
    <HeavyComponent />
  </Suspense>
)}
```

### 15. State-Derived Data Caching

**Problem:** Functions like `getImpedanceData`, `getModuleFace` in useData recalculate values on every call.

**Solution:** Cache derived state with proper dependency tracking.

**Complexity:** Low

**Impact:** Medium - Improves performance by avoiding redundant calculations

```typescript
// Use useMemo for expensive derived calculations
const impedanceData = useMemo(() => {
  if (!graftState.files) return []

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
}, [graftState.files])
```

### 16. Optimized File Reader

**Problem:** File loading operations block the UI and don't provide progress feedback.

**Solution:** Implement a streaming file reader with progress reporting.

**Complexity:** Medium

**Impact:** High - Improves user experience during file loading

```typescript
function readFileWithProgress(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    const chunkSize = 1024 * 1024 // 1MB
    let offset = 0
    let buffer = []

    // Report progress as chunks are read
    reader.onload = function (e) {
      const chunk = e.target.result
      buffer.push(chunk)
      offset += chunkSize

      // Report progress
      setProgress(Math.min(100, Math.round((offset / file.size) * 100)))

      if (offset >= file.size) {
        // Done, combine chunks and process
        resolve(buffer.join(''))
      } else {
        // Read next chunk
        readNextChunk()
      }
    }

    reader.onerror = reject

    function readNextChunk() {
      const slice = file.slice(offset, offset + chunkSize)
      reader.readAsText(slice)
    }

    readNextChunk()
  })
}
```

### 17. Debounced UI Updates

**Problem:** Frequent UI updates during resizing and plotting operations cause performance issues.

**Solution:** Implement proper debouncing and throttling for UI updates.

**Complexity:** Low

**Impact:** Medium - Smoother UI experience during interactive operations

```typescript
// Enhanced resize observer with proper debouncing
function useEnhancedResizeObserver(ref, callback, options = {}) {
  const { delay = 100, leading = false, trailing = true } = options
  const debouncedCallback = useMemo(
    () => debounce(callback, delay, { leading, trailing }),
    [callback, delay, leading, trailing]
  )

  useEffect(() => {
    if (!ref.current) return

    const observer = new ResizeObserver(debouncedCallback)
    observer.observe(ref.current)

    return () => {
      debouncedCallback.cancel()
      observer.disconnect()
    }
  }, [ref, debouncedCallback])
}
```

## Combined Strategy for Frontend and WASM Integration

For maximum performance improvement, we recommend implementing these frontend optimizations alongside the WebAssembly optimizations. The key areas to focus on are:

1. **State Management** - Split monolithic state into smaller, focused contexts
2. **Asynchronous Processing** - Move heavy operations off the main thread
3. **Memoization and Caching** - Prevent redundant calculations and renders
4. **Code Splitting** - Lazy load components and functionality
5. **Data Structure Optimization** - Use appropriate data structures for each use case

By addressing these areas systematically, the application should see significantly improved performance in loading time, responsiveness, and overall user experience.

## Additional Component-specific Optimizations

### 18. Frequency Analysis Component Optimization

**Problem:** The `frequency-analysis` components have multiple optimization issues:

- Inefficient dependency tracking in `plot-container.tsx` (only tracking first item in array)
- Redundant data transformation on each render
- No memoization for transformed plot data

**Solution:** Apply proper dependency tracking, memoization, and more efficient data transformation.

**Complexity:** Low

**Impact:** Medium - Reduces unnecessary calculations and renders in frequency analysis

```typescript
// In plot-container.tsx
import { useMemo } from 'react';

const PlotContainer = ({ className }: PlotContainerProps) => {
  // Use an object reference to track if data changed instead of just the first item
  const {
    graftState: { uniqueFrequencyCalc }
  } = React.useContext(GrafContext)

  // Use useMemo for data transformation
  const grafDataByPlots = useMemo(() => {
    if (!uniqueFrequencyCalc || uniqueFrequencyCalc.length === 0) return null;

    const module = [];
    const phase = [];
    const zi = [];
    const zr = [];

    uniqueFrequencyCalc.forEach((g, i) => {
      module.push([Number(g[i].frequency), g[i].module.m, g[i].module.r]);
      phase.push([Number(g[i].frequency), g[i].phase.m, g[i].module.r]);
      zi.push([Number(g[i].frequency), g[i].zi.m, g[i].module.r]);
      zr.push([Number(g[i].frequency), g[i].zr.m, g[i].module.r]);
    });

    return { module, phase, zi, zr };
  }, [uniqueFrequencyCalc]); // Properly track the entire array

  return (
    <div className={cn(className, 'h-full w-[100%] overflow-auto overflow-x-hidden')}>
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <PlotItem title="Module" dataToGraf={grafDataByPlots?.module} />
        <PlotItem title="Phase" dataToGraf={grafDataByPlots?.phase} />
        <PlotItem title="ZI" dataToGraf={grafDataByPlots?.zi} />
        <PlotItem title="ZR" dataToGraf={grafDataByPlots?.zr} />
      </div>
    </div>
  );
};
```

### 19. HotTable Component Optimization in File Content

**Problem:** The `file-content.tsx` component initializes HyperFormula instance on each render and doesn't optimize table rendering for large datasets.

**Solution:** Move the HyperFormula initialization outside component render cycle and add virtualization for large datasets.

**Complexity:** Medium

**Impact:** High - Significantly improves performance when viewing large files

```typescript
// Initialize HyperFormula outside component to prevent recreation on each render
const hyperformulaInstance = HyperFormula.buildEmpty({
  licenseKey: 'internal-use-in-handsontable'
})

const FileContent = ({ data, template }: FileContentProps) => {
  const hotTableComponent = React.useRef(null)

  // Memoize cell renderer function to prevent recreation on each render
  const renderCellColors = React.useCallback((prop: string) => {
    const color = prop
    return function (instance, TD, row, col, prop, value, cellProperties) {
      textRenderer.apply(this, [instance, TD, row, col, prop, value, cellProperties])
      TD.style.fontWeight = 'bold'
      TD.style.color = color
      TD.style.background = tinycolor(color).lighten(40).toString()
      TD.style.textAlign = 'center'
    }
  }, [])

  // Optimize table settings for large datasets
  const tableSettings = React.useMemo(
    () => ({
      height: '37vh',
      width: '35vw',
      licenseKey: 'non-commercial-and-evaluation',
      colHeaders: true,
      rowHeaders: true,
      manualRowResize: true,
      manualColumnResize: true,
      readOnly: true,
      // Only render visible data for better performance
      viewportRowRenderingOffset: 20,
      viewportColumnRenderingOffset: 5,
      formulas: {
        engine: hyperformulaInstance
      },
      data
    }),
    [data]
  )

  // Rest of component...
}
```

### 20. Import Dialog State Management

**Problem:** The `import-dialog.tsx` component uses multiple separate state variables for related data, causing excessive re-renders.

**Solution:** Consolidate related state into a single reducer to minimize render cycles.

**Complexity:** Low

**Impact:** Medium - Reduces unnecessary re-renders in the import workflow

```typescript
// Define more organized state using useReducer
function importDialogReducer(state, action) {
  switch (action.type) {
    case 'SET_SELECTED_TEMPLATE':
      return { ...state, selectedTemplate: action.payload }
    case 'SET_SELECTED_FILE':
      return { ...state, selectedFile: action.payload }
    case 'SET_IMPORTED_FILES':
      return { ...state, importedFiles: action.payload }
    case 'SET_TEMPLATES':
      return { ...state, templates: action.payload }
    case 'RESET':
      return {
        selectedFile: undefined,
        templates: [],
        importedFiles: [],
        selectedTemplate: undefined
      }
    default:
      return state
  }
}

const ImportDialog = () => {
  // Consolidate related state with useReducer
  const [state, dispatch] = React.useReducer(importDialogReducer, {
    selectedTemplate: undefined,
    selectedFile: undefined,
    importedFiles: [],
    templates: []
  })

  // Access state values
  const { selectedTemplate, selectedFile, importedFiles, templates } = state

  // Update state
  const handleImportFiles = () => {
    // Process files...

    // Reset state
    dispatch({ type: 'RESET' })
  }

  // Rest of component...
}
```

### 21. Optimized Table Cell Rendering

**Problem:** The cell rendering in `file-content.tsx` recalculates cell styles on every render, which is unnecessary.

**Solution:** Optimize cell property calculations with memoization based on row, column, and template.

**Complexity:** Low

**Impact:** Medium - Improves scrolling performance in large tables

```typescript
const FileContent = ({ data, template }: FileContentProps) => {
  // ... other code

  // Create a memoized cells callback that only updates when template changes
  const cellsCallback = React.useCallback((row, col) => {
    const cellProperties: CellProperties = {} as CellProperties;

    if (row === template?.template?.row) {
      cellProperties.renderer = renderCellColors('gray');
      return cellProperties;
    }

    let color = '';
    if (template?.template?.columns) {
      const column = Object.values(template.template.columns).find((v) => v?.col === col);
      if (column) {
        color = column.color;
      }
    }

    if (color) {
      cellProperties.renderer = renderCellColors(color);
    }

    return cellProperties;
  }, [template, renderCellColors]);

  return (
    <div className="my-3 h-full overflow-hidden">
      {data?.length && (
        <div id="example-preview">
          <HotTable
            ref={hotTableComponent}
            settings={tableSettings}
            cells={cellsCallback}
          />
        </div>
      )}
    </div>
  );
};
```

### 22. Lazy Loading of Import Dialog Content

**Problem:** The import dialog loads all its content eagerly, including heavy components like HotTable, even before they're needed.

**Solution:** Implement lazy loading for the import dialog content components.

**Complexity:** Low

**Impact:** Medium - Reduces initial load time and improves responsiveness

```typescript
import * as React from 'react';
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const FileContent = lazy(() => import('./import-dialog-actions/file-content'));

const ImportDialog = () => {
  // ... state management

  return (
    <Dialog open={open} onOpenChange={() => setOpen((prev) => !prev)}>
      {/* ... dialog header */}

      <div className="mt-4 grid h-full grid-cols-4">
        <ImportTemplate
          setSelectedTemplate={setSelectedTemplate}
          selectedTemplate={selectedTemplate}
          templates={templates}
          setTemplates={setTemplates}
        />
        <ImportFiles
          setSelectedFile={setSelectedFile}
          selectedFile={selectedFile}
          setImportedFiles={setImportedFiles}
          importedFiles={importedFiles}
          disabled={templates?.length < 1}
        />
        <div className="col-span-2 flex flex-col">
          <div className="w-full rounded-md px-3 font-bold">
            File Content: {selectedFile?.name}
          </div>
          <div>
            {/* Only load FileContent when we have selected a file */}
            {selectedFile && (
              <Suspense fallback={<div>Loading table view...</div>}>
                <FileContent data={selectedFile?.content} template={selectedTemplate} />
              </Suspense>
            )}
          </div>
        </div>
      </div>

      {/* ... dialog footer */}
    </Dialog>
  );
};
```

### 23. Drag and Drop Performance Optimization

**Problem:** The `drag-drop.tsx` component has several performance issues:

- Uses complex state updates that cause cascading re-renders
- Has unnecessary validations running on every render
- Uses inefficient setTimeout for state initialization
- Performs excessive re-renders during drag operations

**Solution:** Apply memoization, extract validation logic, and optimize state updates.

**Complexity:** Medium

**Impact:** High - Improves responsiveness during interactive drag and drop operations

```typescript
// Optimize by using memoization and more efficient state management
import * as React from 'react'
import { useCallback, useMemo } from 'react'

const DragDrop = ({ PlotlyChart }: { PlotlyChart: React.ReactElement }) => {
  // Existing state and context usage...

  // Extract validation to a memoized function
  const validationErrors = useMemo(() => {
    const errors = [];

    if (
      _.isEmpty(itemGroups.xAxis) &&
      _.isEmpty(itemGroups.yAxis) &&
      _.isEmpty(itemGroups.y2Axis)
    ) {
      errors.push('No columns selected');
    }

    if (_.isEmpty(itemGroups.xAxis)) {
      errors.push('X axis is empty');
    }

    // Add other validation rules...

    return errors;
  }, [itemGroups.xAxis, itemGroups.yAxis, itemGroups.y2Axis]);

  // Memoize handler functions
  const handleApply = useCallback(() => {
    // Check for validation errors
    if (validationErrors.length > 0) {
      enqueueSnackbar(validationErrors[0], { variant: 'error' });
      return;
    }

    setSelectedColumns(
      csvFileColum.map((csv) =>
        csv?.fileName === data?.find((d) => d.selected)?.name
          ? ({
              ...csv,
              notSelected: itemGroups.columns,
              x: itemGroups.xAxis,
              y: itemGroups.yAxis,
              y2: itemGroups.y2Axis
            } as ICsvFileColum)
          : csv
      )
    );
  }, [itemGroups, csvFileColum, data, enqueueSnackbar, setSelectedColumns, validationErrors]);

  // Memoize handlers for drag operations
  const handleDragStart = useCallback(({ active }) => setActiveId(active.id), []);
  const handleDragCancel = useCallback(() => setActiveId(undefined), []);
  const handleDragEnd = useCallback(({ active, over }) => {
    // Existing drag end logic...
  }, [itemGroups]);

  // Use effect with proper dependencies
  React.useEffect(() => {
    const fileColumns = csvFileColum?.find((c) => c.selected);

    // Don't use setTimeout, directly update state
    setItemGroups({
      columns: !_.isEmpty(fileColumns) ? fileColumns.notSelected || [] : [],
      xAxis: !_.isEmpty(fileColumns) ? (fileColumns.x?.map((d) => ({ name: d.name, index: d.index })) || []) : [],
      yAxis: !_.isEmpty(fileColumns) ? (fileColumns.y?.map((d) => ({ name: d.name, index: d.index })) || []) : [],
      y2Axis: !_.isEmpty(fileColumns) ? (fileColumns.y2?.map((d) => ({ name: d.name, index: d.index })) || []) : []
    });
  }, [csvFileColum]);

  // Optimize the rendering of list items with React.memo
  const MemoizedDroppable = React.memo(Droppable);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      {/* Rest of component... */}
      <MemoizedDroppable
        id="columns"
        items={itemGroups['columns'].length > 0 ? itemGroups['columns'] : []}
        name="Columns"
        isNotIndex
      />
      {/* Rest of component... */}
    </DndContext>
  );
};

export default React.memo(DragDrop);
```

### 24. Minimizing Expensive DOM Operations

**Problem:** The application makes frequent updates to the DOM when handling user interactions, especially in components using drag and drop or rich visualization elements, causing unnecessary rerenders.

**Solution:** Implement throttling and debouncing for frequent state updates, and use the React profiler to identify and fix render bottlenecks.

**Complexity:** Low

**Impact:** Medium - Provides smoother user interactions and reduces UI jank

```typescript
import { throttle, debounce } from 'lodash';
import { useState, useEffect, useCallback } from 'react';

// Custom hook for debounced state updates
function useDebouncedState(initialValue, delay = 300) {
  const [immediateValue, setImmediateValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  const debouncedSetValue = useCallback(
    debounce((value) => {
      setDebouncedValue(value);
    }, delay),
    [delay]
  );

  useEffect(() => {
    debouncedSetValue(immediateValue);
    return () => {
      debouncedSetValue.cancel();
    };
  }, [immediateValue, debouncedSetValue]);

  return [debouncedValue, setImmediateValue, immediateValue];
}

// Example usage in a component with frequent updates
export function OptimizedInteractiveComponent() {
  const [position, setPosition, immediatePosition] = useDebouncedState({ x: 0, y: 0 });

  // Handle mouse move with throttling for smoother interactions
  const handleMouseMove = useCallback(
    throttle((e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    }, 16), // Approx. 60fps
    []
  );

  // Show immediate feedback to user while sending debounced updates to expensive components
  return (
    <div onMouseMove={handleMouseMove}>
      {/* Simple visual feedback using immediate value */}
      <div style={{
        transform: `translate(${immediatePosition.x}px, ${immediatePosition.y}px)`,
        position: 'absolute'
      }}>
        Cursor Tracker
      </div>

      {/* Expensive component only updates when debounced value changes */}
      <ExpensiveComponent position={position} />
    </div>
  );
}

// Wrap expensive components with memo to prevent unnecessary re-renders
const ExpensiveComponent = React.memo(({ position }) => {
  // Complex rendering based on position
  return <div>Heavy calculation based on {position.x}, {position.y}</div>;
});
```

### 25. Loader Component Animation Optimization

**Problem:** The `loader.tsx` component uses CSS animations with numerous DOM elements (16 DNA elements) which can cause performance issues during loading.

**Solution:** Use more efficient CSS animations or replace with SVG animation.

**Complexity:** Low

**Impact:** Low-Medium - Improves loading performance on low-end devices

```tsx
// Optimized loader using SVG instead of multiple divs
import * as React from 'react'

const Loader = () => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 w-full h-full">
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid"
      className="transform rotate-z-[-20deg]"
    >
      {/* SVG DNA animation - more efficient than multiple divs */}
      <path d="M20,50 Q40,5 50,50 T80,50" stroke="#3498db" strokeWidth="2" fill="none">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 50 50"
          to="360 50 50"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </path>
      <path d="M20,50 Q40,95 50,50 T80,50" stroke="#e74c3c" strokeWidth="2" fill="none">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 50 50"
          to="360 50 50"
          dur="2s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  </div>
)

// Memoize the loader to prevent unnecessary re-renders
export default React.memo(Loader)
```

### 26. Plot Options Optimization with Memoization

**Problem:** The `useFrequencyUniquePlotOptions.tsx` hook recalculates plot options on every render and has inefficient dependency tracking (only tracking data length).

**Solution:** Properly memoize plot data and layout, and improve dependency tracking.

**Complexity:** Low

**Impact:** Medium - Reduces unnecessary calculations in plot rendering

```typescript
import React, { useMemo, useCallback, useState, useEffect } from 'react'
import _ from 'lodash'
import { useTheme } from 'next-themes'

import { defaultTheme } from '@/utils'

import { hovertemplate } from './usePlotlyOptions'
import { PlotParams } from 'react-plotly.js'

type useFrequencyUniquePlotOptionsProps = {
  data: [number, number, number][]
  title: string
}

const useFrequencyUniquePlotOptions = ({ data, title }: useFrequencyUniquePlotOptionsProps) => {
  const [plotOptions, setPlotOptions] = useState({})
  const { theme, systemTheme } = useTheme()
  const t = useMemo(() => defaultTheme({ theme, systemTheme }), [theme, systemTheme])

  // Memoize font color based on theme
  const fontColor = useMemo(() => (t === 'dark' ? '#e6e6e6' : '#262626'), [t])

  // Memoize plot data based on actual data contents
  const plotData = useMemo(() => {
    if (!data || data.length === 0) return []

    return [
      {
        x: data.map((d) => d[0]), // frequency
        y: data.map((d) => d[1]), // slope
        type: 'scatter',
        hovertemplate: hovertemplate(`${'Slope'}`),
        mode: 'markers',
        name: `Slope`,
        marker: { color: 'red', size: 5 },
        yaxis: 'y2',
        legendgroup: `slope`
      },
      {
        x: data.map((d) => d[0]), // frequency
        y: data.map((d) => d[2]), // r2
        type: 'scatter',
        hovertemplate: hovertemplate(`R<sup>2</sup>`),
        mode: 'markers',
        name: `R<sup>2</sup>`,
        marker: { color: 'blue', size: 5 },
        legendgroup: `R<sup>2</sup>`
      }
    ]
  }, [data])

  // Memoize plot layout based on theme and title
  const plotLayout = useMemo(() => {
    return {
      legend: {
        x: 0.8,
        y: 1,
        traceorder: 'normal',
        bgcolor: t === 'dark' ? '#cccccc' : '#4d4d4d',
        bordercolor: t === 'dark' ? '#404040' : '#e6e6e6',
        borderwidth: 1,
        font: {
          family: 'sans-serif',
          size: 12,
          color: t === 'dark' ? '#404040' : '#e6e6e6'
        }
      },
      hovermode: 'x unified',
      title: {
        text: title,
        font: { size: 18 },
        xref: 'paper',
        x: 0.005
      },
      xaxis: {
        showticklabels: true,
        zeroline: false,
        mirror: 'ticks',
        title: {
          text: 'log<sub>10</sub>(Frequency(Hz))',
          font: { size: 18, color: fontColor }
        },
        color: t === 'dark' ? '#e6e6e6' : '#404040',
        dividercolor: t === 'dark' ? '#fff' : '#000',
        gridcolor: t === 'dark' ? '#404040' : ' #e6e6e6'
      },
      yaxis: {
        title: {
          text: 'R<sup>2</sup>',
          x: 0,
          font: { size: 18, color: 'blue' },
          tickfont: { color: 'blue' }
        },
        zeroline: false,
        tickfont: { color: 'blue' },
        color: t === 'dark' ? '#e6e6e6' : '#404040',
        dividercolor: t === 'dark' ? '#fff' : '#000',
        gridcolor: t === 'dark' ? '#404040' : ' #e6e6e6'
      },
      yaxis2: {
        title: {
          text: 'Slope',
          x: 0,
          font: { size: 18, color: 'red' },
          tickfont: { color: 'red' }
        },
        zeroline: false,
        overlaying: 'y',
        side: 'right',
        titlefont: { color: 'red', size: 18 },
        tickfont: { color: 'red' },
        color: t === 'dark' ? '#e6e6e6' : '#404040',
        dividercolor: t === 'dark' ? '#fff' : '#000',
        gridcolor: t === 'dark' ? '#404040' : ' #e6e6e6'
      },
      plot_bgcolor: t === 'dark' ? '#000' : '#fff',
      paper_bgcolor: t === 'dark' ? '#000' : '#fff',
      font: { color: t === 'dark' ? '#e6e6e6' : '#404040' },
      modebar: {
        activecolor: t === 'dark' ? '#bfbfbf' : '#404040',
        add: '',
        bgcolor: t === 'dark' ? '#000' : '#fff',
        color: t === 'dark' ? '#bfbfbf' : '#404040',
        orientation: 'v'
      }
    }
  }, [t, fontColor, title])

  // Memoized plot options
  const memoizedPlotOptions = useMemo(
    () => ({
      scrollZoom: true,
      editable: true
    }),
    []
  )

  // Expose handleSetPlotOptions for backward compatibility
  const handleSetPlotOptions = useCallback(() => {
    setPlotOptions(memoizedPlotOptions)
  }, [memoizedPlotOptions])

  useEffect(() => {
    handleSetPlotOptions()
    // Only run once on component mount
  }, [])

  return {
    plotOptions: memoizedPlotOptions,
    plotData,
    plotLayout,
    handleSetPlotOptions
  }
}

export default useFrequencyUniquePlotOptions
```

### 27. Global Performance Monitoring System

**Problem:** Currently, there's no way to systematically identify performance bottlenecks across the application.

**Solution:** Implement a performance monitoring system using React's Profiler API and browser Performance API.

**Complexity:** Medium

**Impact:** High - Allows ongoing identification and optimization of performance issues

```typescript
// Create a performance monitoring hook
import { useEffect, useRef } from 'react';

const PERFORMANCE_THRESHOLD_MS = 16; // ~60fps

interface PerformanceMetric {
  componentName: string;
  renderTime: number;
  timestamp: number;
}

// Central store for performance metrics
let performanceMetrics: PerformanceMetric[] = [];

// Component wrapper for performance monitoring
export const withPerformanceTracking = (WrappedComponent, componentName) => {
  return (props) => {
    const onRender = (id, phase, actualDuration) => {
      if (actualDuration > PERFORMANCE_THRESHOLD_MS) {
        performanceMetrics.push({
          componentName: componentName || id,
          renderTime: actualDuration,
          timestamp: Date.now(),
        });

        console.warn(`Slow render detected in ${componentName || id}: ${actualDuration.toFixed(2)}ms`);
      }
    };

    return (
      <React.Profiler id={componentName || 'Component'} onRender={onRender}>
        <WrappedComponent {...props} />
      </React.Profiler>
    );
  };
};

// Hook to track interaction performance
export function useInteractionTracking(interactionName) {
  const startTimeRef = useRef(0);

  const startTracking = () => {
    startTimeRef.current = performance.now();
  };

  const endTracking = () => {
    const duration = performance.now() - startTimeRef.current;
    if (duration > PERFORMANCE_THRESHOLD_MS) {
      performanceMetrics.push({
        componentName: `Interaction: ${interactionName}`,
        renderTime: duration,
        timestamp: Date.now(),
      });

      console.warn(`Slow interaction detected: ${interactionName} took ${duration.toFixed(2)}ms`);
    }
    return duration;
  };

  return { startTracking, endTracking };
}

// API to retrieve performance metrics
export function getPerformanceMetrics() {
  return [...performanceMetrics];
}

export function clearPerformanceMetrics() {
  performanceMetrics = [];
}
```

### 28. Optimizing Plot Options Generation with useMemo

**Problem:** The `usePlotlyOptions.tsx` hook has several performance issues:

- A large complex useEffect with multiple nested conditionals
- Redundant data transformations on every render
- Inefficient dependency array in useEffect causing unnecessary recalculations
- No memoization for expensive layout and data computations

**Solution:** Refactor to use memoization and split conditional logic into separate functions

**Complexity:** Medium

**Impact:** High - Significantly reduces rendering time for plots, which are central to the application

```typescript
import * as React from 'react'
import { useMemo, useState, useContext, useEffect, useCallback } from 'react'
import _ from 'lodash'
import { useTheme } from 'next-themes'
import { useWindowSize } from 'usehooks-ts'
import { PlotParams } from 'react-plotly.js'

import { defaultTheme, COLORS } from '@/utils'

import { GrafContext } from '../context/GraftContext'
import { useData } from './useData'

export const hovertemplate = (name: string) => `
  <b>${name}</b><br>
  <br>
  %{yaxis.title.text}: %{y}<br>
  %{xaxis.title.text}: %{x}<br>
  <extra></extra>
`

// Memoized function to generate static values
const useStaticValues = () => {
  return useMemo(
    () => ({
      autosize: true,
      legend: {
        x: -5,
        y: 1,
        traceorder: 'normal',
        font: {
          family: 'sans-serif',
          size: 12,
          color: '#000'
        }
      },
      margin: {
        l: 50,
        r: 50,
        b: 100,
        t: 50,
        pad: 4
      },
      title: {
        font: {
          size: 18
        },
        xref: 'paper',
        x: 0.005
      }
    }),
    []
  )
}

const usePlotlyOptions = () => {
  const {
    graftState: {
      fileType,
      graftType,
      impedanceType,
      stepBetweenPoints,
      drawerOpen,
      csvFileColum,
      lineOrPointWidth
    }
  } = useContext(GrafContext)
  const { height, width } = useWindowSize()

  const { theme } = useTheme()
  const t = useMemo(() => defaultTheme(theme), [theme])

  const {
    getImpedanceData,
    getModuleFace,
    getVCData,
    getZIZRvsFrequency,
    getCSVData,
    data: currentData
  } = useData()

  const [layout, setLayout] = useState<PlotParams['layout'] | null>(null)
  const [config, setConfig] = useState({
    scrollZoom: true,
    editable: true
  })
  const [data, setData] = useState<PlotParams['data']>([])

  // Memoize font color based on theme
  const fontColor = useMemo(() => (t === 'dark' ? '#e6e6e6' : '#262626'), [t])

  // Memoize static values
  const staticValues = useStaticValues()

  // Memoized function to generate Teq4Z Bode data
  const generateTeq4zBodeData = useCallback(() => {
    if (!currentData?.length || fileType !== 'teq4z' || impedanceType !== 'Bode') {
      return null
    }

    return _.flatMapDepth(
      getModuleFace()?.map((d) => [
        // Phase data
        {
          x: d.content.map((i) => i.face.x),
          y: d.content.map((i) => i.face.y),
          type: 'scatter',
          hovertemplate: hovertemplate(`phase_${d.name}`),
          mode: graftType === 'line' ? 'lines+markers' : 'markers',
          name: `phase_${d.name}`,
          marker: {
            color: d.color,
            size: graftType === 'line' ? lineOrPointWidth + 3 : lineOrPointWidth
          },
          line: { color: d.color, width: lineOrPointWidth },
          yaxis: 'y2',
          legendgroup: `${d.name}`
        },
        // Module data
        {
          x: d.content.map((i) => i.module.x),
          y: d.content.map((i) => i.module.y),
          type: 'scatter',
          hovertemplate: hovertemplate(`module_${d.name}`),
          mode: graftType === 'line' ? 'lines+markers' : 'markers',
          name: `module_${d.name}`,
          marker: {
            color: d.color,
            size: graftType === 'line' ? lineOrPointWidth + 3 : lineOrPointWidth
          },
          line: { color: d.color, width: lineOrPointWidth },
          legendgroup: `${d.name}`
        }
      ])
    )
  }, [currentData, fileType, impedanceType, graftType, lineOrPointWidth, getModuleFace])

  // Similar memoized functions for other plot types
  const generateTeq4zNyquistData = useCallback(() => {
    if (!currentData?.length || fileType !== 'teq4z' || impedanceType !== 'Nyquist') {
      return null
    }

    return getImpedanceData().map((d) => ({
      x: d.content.map((i) => i[0]),
      y: d.content.map((i) => i[1]),
      hovertemplate: hovertemplate(d.name),
      type: 'scatter',
      mode: graftType === 'line' ? 'lines+markers' : 'markers',
      name: d.name,
      marker: {
        color: d.color,
        size: graftType === 'line' ? lineOrPointWidth + 3 : lineOrPointWidth
      },
      line: { color: d.color, width: lineOrPointWidth }
    }))
  }, [currentData, fileType, impedanceType, graftType, lineOrPointWidth, getImpedanceData])

  // Instead of updating state inside a large effect, use useMemo for the final data
  const plotData = useMemo(() => {
    if (!currentData?.length) return []

    if (fileType === 'teq4z') {
      if (impedanceType === 'Bode') {
        return generateTeq4zBodeData() || []
      } else if (impedanceType === 'Nyquist') {
        return generateTeq4zNyquistData() || []
      } else if (impedanceType === 'ZiZrVsFreq') {
        // Similar implementation for ZiZrVsFreq
        // This would be another memoized function
        return []
      }
    } else if (fileType === 'teq4') {
      return getVCData(stepBetweenPoints).map((d) => ({
        x: d.content.map((j) => j[0]),
        y: d.content.map((j) => j[1]),
        type: 'scatter',
        hovertemplate: hovertemplate(d.name),
        mode: graftType === 'line' ? 'lines' : 'markers',
        name: d.name,
        marker: { color: d.color, size: graftType === 'line' ? 0 : lineOrPointWidth },
        line: { color: d.color, width: lineOrPointWidth },
        color: d.color
      }))
    } else if (fileType === 'csv') {
      // CSV data handling
      // This would be moved to a separate memoized function
    }

    return []
  }, [
    currentData,
    fileType,
    impedanceType,
    graftType,
    lineOrPointWidth,
    stepBetweenPoints,
    generateTeq4zBodeData,
    generateTeq4zNyquistData,
    getVCData
  ])

  // Generate layout based on current settings
  const plotLayout = useMemo(() => {
    if (!currentData?.length) return staticValues

    // Base layout with shared properties
    const baseLayout = {
      ...staticValues,
      hovermode: 'closest'
      // Adjust other shared properties here
    }

    if (fileType === 'teq4z') {
      if (impedanceType === 'Bode') {
        return {
          ...baseLayout,
          title: {
            text: impedanceType,
            font: { size: 18, color: fontColor },
            xref: 'paper',
            x: 0.005
          },
          xaxis: {
            title: {
              text: 'log10(Frequency(Hz))',
              font: { size: 18, color: fontColor }
            }
          },
          yaxis: {
            title: {
              text: 'Module',
              font: { size: 18, color: fontColor }
            }
          },
          yaxis2: {
            title: 'Phase',
            overlaying: 'y',
            side: 'right',
            titlefont: { color: fontColor, size: 18 },
            tickfont: { color: fontColor }
          }
        }
      } else if (impedanceType === 'Nyquist') {
        // Nyquist layout
      }
    } else if (fileType === 'teq4') {
      // VC layout
    }

    return baseLayout
  }, [currentData, fileType, impedanceType, staticValues, fontColor])

  // Update state only when memoized values change
  useEffect(() => {
    if (plotData.length > 0) setData(plotData)
    if (plotLayout) setLayout(plotLayout)

    return () => {
      setLayout(null)
      setConfig({ scrollZoom: true, editable: true })
      setData([])
    }
  }, [plotData, plotLayout])

  return {
    layout,
    config,
    data
  }
}

export default React.memo(usePlotlyOptions)
```

### 29. Optimizing Electron Main Process Startup

**Problem:** The Electron main process initializes all IPC handlers during startup regardless of when they'll be used, leading to longer startup times.

**Solution:** Implement lazy registration of IPC handlers and optimization of the main process startup sequence.

**Complexity:** Medium

**Impact:** High - Provides faster application startup times

```typescript
// Optimized main process initialization
import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// Core set of IPC handlers needed immediately
import { setupCoreIPC } from './ipc/core'

// Handlers that can be registered on-demand
import { setupFileIPC } from './ipc/file'
import { setupWindowIPC } from './ipc/window'

let mainWindow: BrowserWindow | null = null

// Create window more efficiently
async function createWindow(): Promise<void> {
  // Create the browser window with optimized settings
  mainWindow = new BrowserWindow({
    width: 900,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux'
      ? { icon }
      : { icon: join(__dirname, '../../resources/icon.png') }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: true
    }
  })

  // Setup only core IPC handlers immediately
  setupCoreIPC(mainWindow)

  // Register event listener once
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show()

      // Register non-critical IPC handlers after window is shown
      setTimeout(() => {
        if (mainWindow) {
          setupFileIPC(mainWindow)
          setupWindowIPC(mainWindow)
        }
      }, 1000)
    }
  })

  // Set external link handling once
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the app
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    await mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    await mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Improved app startup sequence
app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')

  // Create window
  await createWindow()

  // Setup development tools conditionally
  if (is.dev) {
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })
  }
})

// Standard app lifecycle handlers
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    mainWindow = null
    app.quit()
  }
})

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow()
  }
})
```

### 30. Async File Processing with Worker Threads

**Problem:** The file walker and file reading operations in `/src/main/lib/fileWalker.ts` process files synchronously, blocking the main thread and causing UI freezes when processing large directories.

**Solution:** Use Node.js worker threads for file reading operations and process directories in batches.

**Complexity:** Medium

**Impact:** High - Prevents UI freezing when loading large directories of files

```typescript
// fileWalker.ts with worker thread optimization
import * as fs from 'fs'
import * as path from 'path'
import { Worker } from 'worker_threads'
import { FileWithRelativePath } from './files'
import { supportedFileTypesArray } from '@shared/constants'
import { fileType } from './utils'

// Process files in batches to prevent memory issues
const BATCH_SIZE = 50

interface WorkerData {
  filePaths: string[]
  rootDir: string
}

export async function walkDirectoryWithFiles(
  rootDir: string,
  currentDir = ''
): Promise<FileWithRelativePath[]> {
  // Get all files recursively but don't read them yet
  const fileEntries = await getAllFileEntries(rootDir, currentDir)

  // Filter files by supported types
  const supportedFiles = fileEntries.filter((entry) => {
    const type = fileType(entry.name)
    return supportedFileTypesArray.includes(type as any)
  })

  // Process files in batches using worker threads
  const results: FileWithRelativePath[] = []
  const batches = []

  for (let i = 0; i < supportedFiles.length; i += BATCH_SIZE) {
    const batch = supportedFiles.slice(i, i + BATCH_SIZE)
    batches.push(batch)
  }

  // Process batches concurrently with limited parallelism
  const MAX_CONCURRENT_BATCHES = 3 // Limit concurrency
  for (let i = 0; i < batches.length; i += MAX_CONCURRENT_BATCHES) {
    const batchGroup = batches.slice(i, i + MAX_CONCURRENT_BATCHES)
    const batchPromises = batchGroup.map((batch) => {
      return processFileBatch(batch, rootDir)
    })

    const batchResults = await Promise.all(batchPromises)
    batchResults.forEach((batchResult) => {
      results.push(...batchResult)
    })
  }

  return results
}

// Helper to get file entries without reading contents
async function getAllFileEntries(
  rootDir: string,
  currentDir = ''
): Promise<{ name: string; path: string }[]> {
  const fullPath = path.join(rootDir, currentDir)
  const entries = fs.readdirSync(fullPath, { withFileTypes: true })
  let files: { name: string; path: string }[] = []

  for (const entry of entries) {
    const entryPath = path.join(currentDir, entry.name)
    const absolutePath = path.join(rootDir, entryPath)

    if (entry.isDirectory()) {
      const subFiles = await getAllFileEntries(rootDir, entryPath)
      files = files.concat(subFiles)
    } else {
      files.push({
        name: entry.name,
        path: absolutePath
      })
    }
  }

  return files
}

// Process a batch of files using a worker thread
function processFileBatch(
  batch: { name: string; path: string }[],
  rootDir: string
): Promise<FileWithRelativePath[]> {
  return new Promise((resolve, reject) => {
    // Create new worker
    const worker = new Worker(
      `
      const { parentPort, workerData } = require('worker_threads');
      const fs = require('fs');
      const path = require('path');
      
      async function processFiles() {
        const { filePaths, rootDir } = workerData;
        const results = [];
        
        for (const filePath of filePaths) {
          try {
            const content = fs.readFileSync(filePath.path, 'utf8');
            const relativePath = path.relative(rootDir, path.dirname(filePath.path));
            
            results.push({
              name: filePath.name,
              type: path.extname(filePath.name).substring(1),
              content,
              relativePath: relativePath.split(path.sep).join('/')
            });
          } catch (err) {
            console.error('Error reading file:', filePath.path, err);
          }
        }
        
        parentPort.postMessage(results);
      }
      
      processFiles();
    `,
      { eval: true, workerData: { filePaths: batch, rootDir } }
    )

    worker.on('message', (results) => {
      resolve(results)
      worker.terminate()
    })

    worker.on('error', (err) => {
      reject(err)
      worker.terminate()
    })
  })
}
```

### 31. Main Process and Renderer Communication Optimization

**Problem:** The current IPC communication pattern sends large amounts of data between the main process and renderer, and uses inefficient data serialization.

**Solution:** Implement optimized IPC patterns with streaming for large data and better serialization.

**Complexity:** Medium

**Impact:** High - Improves file loading speed and application responsiveness

```typescript
// Optimized IPC for large file transfers
import { ipcMain, BrowserWindow } from 'electron'
import * as fs from 'fs'
import { createReadStream } from 'fs'
import * as path from 'path'
import { pipeline } from 'stream/promises'

// Constants for stream processing
const CHUNK_SIZE = 1024 * 1024 // 1MB chunks

export function setupFileIPC(mainWindow: BrowserWindow) {
  // Stream-based file reading for large files
  ipcMain.handle('readLargeFile', async (_, filePath) => {
    try {
      const stats = await fs.promises.stat(filePath)
      const fileSize = stats.size

      // Send file metadata first
      mainWindow.webContents.send('file-metadata', {
        path: filePath,
        size: fileSize,
        name: path.basename(filePath)
      })

      // Setup streaming with progress reporting
      const fileStream = createReadStream(filePath, { highWaterMark: CHUNK_SIZE })

      let bytesRead = 0
      let fileContent = Buffer.alloc(0)

      for await (const chunk of fileStream) {
        // Append chunk to file content
        const newBuffer = Buffer.concat([fileContent, chunk])
        fileContent = newBuffer

        bytesRead += chunk.length

        // Report progress to renderer
        const progress = Math.round((bytesRead / fileSize) * 100)
        if (progress % 5 === 0) {
          // Report every 5% progress
          mainWindow.webContents.send('file-progress', {
            path: filePath,
            progress
          })
        }
      }

      // Complete file reading
      return {
        success: true,
        content: fileContent.toString('utf-8')
      }
    } catch (err) {
      console.error('Error reading file:', err)
      return {
        success: false,
        error: err.message
      }
    }
  })

  // Batch processing for multiple files
  ipcMain.handle('readMultipleFiles', async (_, filePaths) => {
    try {
      // Process files in batches to avoid memory issues
      const MAX_CONCURRENT = 5
      const results = {}

      // Process files in batches
      for (let i = 0; i < filePaths.length; i += MAX_CONCURRENT) {
        const batch = filePaths.slice(i, i + MAX_CONCURRENT)
        const batchPromises = batch.map(async (filePath) => {
          try {
            const content = await fs.promises.readFile(filePath, 'utf-8')
            return { path: filePath, content, success: true }
          } catch (err) {
            return { path: filePath, error: err.message, success: false }
          }
        })

        const batchResults = await Promise.all(batchPromises)

        // Add batch results
        batchResults.forEach((result) => {
          results[result.path] = result
        })

        // Report batch progress
        mainWindow.webContents.send('batch-progress', {
          completed: Math.min(i + MAX_CONCURRENT, filePaths.length),
          total: filePaths.length
        })
      }

      return results
    } catch (err) {
      return { success: false, error: err.message }
    }
  })
}
```
