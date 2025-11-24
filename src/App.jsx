import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
)

const BOUNDS = ['None', 'Keogh', 'Improved', 'Enhanced(5)', 'Petitjean', 'Webb']

const COLORS = [
  '#667eea',
  '#764ba2',
  '#f093fb',
  '#4facfe',
  '#43e97b',
  '#fa709a'
]

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('individual') // 'individual', 'comparison', 'allWindows', 'global'
  const [selectedDataset, setSelectedDataset] = useState('')
  const [selectedWindow, setSelectedWindow] = useState('w5')

  useEffect(() => {
    fetch('/data/results.json')
      .then(res => {
        if (!res.ok) throw new Error('No se pudo cargar los datos')
        return res.json()
      })
      .then(jsonData => {
        setData(jsonData)
        const firstDataset = Object.keys(jsonData)[0]
        setSelectedDataset(firstDataset)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="loading">⏳ Cargando datos...</div>
  if (error) return <div className="error">❌ Error: {error}</div>
  if (!data) return <div className="error">❌ No hay datos disponibles</div>

  const datasets = Object.keys(data)
  const windows = Object.keys(data[selectedDataset] || {}).sort()
  const currentData = data[selectedDataset]?.[selectedWindow]

  // Vista global (todos los datasets y todas las ventanas)
  if (viewMode === 'global') {
    return (
      <div className="container">
        <header>
          <h1>🔍 DTW Bounds Analysis</h1>
          <p className="subtitle">Vista Global: Todos los Datasets × Todas las Ventanas</p>
        </header>

        <div className="controls">
          <button 
            className="btn-primary"
            onClick={() => setViewMode('individual')}
          >
            📊 Vista Individual
          </button>
        </div>

        <GlobalView data={data} />
      </div>
    )
  }

  // Vista de todas las ventanas
  if (viewMode === 'allWindows') {
    return (
      <div className="container">
        <header>
          <h1>🔍 DTW Bounds Analysis</h1>
          <p className="subtitle">Análisis de todas las ventanas para {selectedDataset}</p>
        </header>

        <div className="controls">
          <button 
            className="btn-primary"
            onClick={() => setViewMode('individual')}
          >
            📊 Vista Individual
          </button>

          <select value={selectedDataset} onChange={(e) => setSelectedDataset(e.target.value)}>
            {datasets.map(ds => (
              <option key={ds} value={ds}>{ds}</option>
            ))}
          </select>
        </div>

        <AllWindowsView data={data[selectedDataset]} datasetName={selectedDataset} />
      </div>
    )
  }

  // Vista de comparación de todos los datasets
  if (viewMode === 'comparison') {
    return (
      <div className="container">
        <header>
          <h1>🔍 DTW Bounds Analysis</h1>
          <p className="subtitle">Comparación de todos los datasets</p>
        </header>

        <div className="controls">
          <button 
            className="btn-primary"
            onClick={() => setViewMode('individual')}
          >
            📊 Vista Individual
          </button>

          <select value={selectedWindow} onChange={(e) => setSelectedWindow(e.target.value)}>
            {windows.map(w => (
              <option key={w} value={w}>Ventana {w.replace('w', '')}</option>
            ))}
          </select>
        </div>

        <ComparisonView data={data} selectedWindow={selectedWindow} />
      </div>
    )
  }

  // Vista individual
  if (!currentData) {
    return <div className="error">❌ No hay datos para esta selección</div>
  }

  // Gráfica de Accuracy
  const accuracyData = {
    labels: BOUNDS,
    datasets: [{
      label: 'Precisión',
      data: currentData.accuracy || [],
      backgroundColor: COLORS,
      borderColor: COLORS.map(c => c + 'CC'),
      borderWidth: 2,
    }]
  }

  // Gráfica de Pruned
  const prunedData = {
    labels: BOUNDS,
    datasets: [{
      label: 'Cálculos Podados',
      data: currentData.pruned || [],
      backgroundColor: COLORS,
      borderColor: COLORS.map(c => c + 'CC'),
      borderWidth: 2,
    }]
  }

  // Gráfica de Times
  const timesData = {
    labels: BOUNDS,
    datasets: [{
      label: 'Tiempo (ms)',
      data: currentData.times || [],
      backgroundColor: COLORS,
      borderColor: COLORS.map(c => c + 'CC'),
      borderWidth: 2,
    }]
  }

  // Gráfica comparativa por ventanas (Pruned)
  const comparisonData = {
    labels: windows,
    datasets: BOUNDS.map((bound, idx) => ({
      label: bound,
      data: windows.map(w => {
        const windowData = data[selectedDataset][w]
        return windowData?.pruned?.[idx] || 0
      }),
      borderColor: COLORS[idx],
      backgroundColor: COLORS[idx] + '33',
      tension: 0.3,
    }))
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  }

  return (
    <div className="container">
      <header>
        <h1>🔍 DTW Bounds Analysis</h1>
        <p className="subtitle">Análisis de Lower Bounds para Dynamic Time Warping</p>
      </header>

      <div className="controls">
        <button 
          className="btn-primary"
          onClick={() => setViewMode('global')}
        >
          🌍 Vista Global
        </button>

        <button 
          className="btn-primary"
          onClick={() => setViewMode('allWindows')}
        >
          🪟 Todas las Ventanas
        </button>

        <button 
          className="btn-primary"
          onClick={() => setViewMode('comparison')}
        >
          📈 Todos los Datasets
        </button>

        <select value={selectedDataset} onChange={(e) => setSelectedDataset(e.target.value)}>
          {datasets.map(ds => (
            <option key={ds} value={ds}>{ds}</option>
          ))}
        </select>

        <select value={selectedWindow} onChange={(e) => setSelectedWindow(e.target.value)}>
          {windows.map(w => (
            <option key={w} value={w}>Ventana {w.replace('w', '')}</option>
          ))}
        </select>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3>📊 Precisión por Bound</h3>
          <Bar data={accuracyData} options={chartOptions} />
        </div>

        <div className="chart-container">
          <h3>⚡ Cálculos Podados (Eficiencia)</h3>
          <Bar data={prunedData} options={chartOptions} />
        </div>

        <div className="chart-container">
          <h3>⏱️ Tiempo de Ejecución</h3>
          <Bar data={timesData} options={chartOptions} />
        </div>

        <div className="chart-container">
          <h3>📈 Eficiencia por Ventana</h3>
          <Line data={comparisonData} options={chartOptions} />
        </div>
      </div>
    </div>
  )
}

// Vista Global: Todos los datasets × Todas las ventanas
function GlobalView({ data }) {
  const datasets = Object.keys(data)
  const allWindows = datasets.length > 0 ? Object.keys(data[datasets[0]]).sort() : []

  // Calcular promedios globales
  const globalStats = {
    totalTests: datasets.length * allWindows.length,
    bounds: BOUNDS.length,
    windows: allWindows.length,
    datasets: datasets.length
  }

  // Calcular el mejor bound en promedio (todos datasets × todas ventanas)
  const boundGlobalAvg = BOUNDS.map((bound, boundIdx) => {
    let totalPruned = 0
    let totalAccuracy = 0
    let totalTime = 0
    let count = 0

    datasets.forEach(dataset => {
      allWindows.forEach(window => {
        const windowData = data[dataset]?.[window]
        if (windowData) {
          totalPruned += windowData.pruned?.[boundIdx] || 0
          totalAccuracy += windowData.accuracy?.[boundIdx] || 0
          totalTime += windowData.times?.[boundIdx] || 0
          count++
        }
      })
    })

    return {
      bound,
      avgPruned: count > 0 ? totalPruned / count : 0,
      avgAccuracy: count > 0 ? totalAccuracy / count : 0,
      avgTime: count > 0 ? totalTime / count : 0,
      count
    }
  }).sort((a, b) => b.avgPruned - a.avgPruned)

  // Heatmap data: Eficiencia promedio por dataset y ventana
  const heatmapByDataset = datasets.map(dataset => {
    return allWindows.map(window => {
      const windowData = data[dataset]?.[window]
      if (!windowData?.pruned) return 0
      // Promedio de eficiencia de todos los bounds
      return windowData.pruned.reduce((sum, val) => sum + val, 0) / windowData.pruned.length
    })
  })

  // Encontrar el máximo para normalizar colores
  const maxHeatmap = Math.max(...heatmapByDataset.flat())

  // Evolución de eficiencia promedio por ventana (promediando todos los datasets)
  const avgEfficiencyByWindow = {
    labels: allWindows.map(w => w.replace('w', '')),
    datasets: BOUNDS.map((bound, idx) => ({
      label: bound,
      data: allWindows.map(window => {
        let sum = 0
        let count = 0
        datasets.forEach(dataset => {
          const val = data[dataset]?.[window]?.pruned?.[idx]
          if (val !== undefined) {
            sum += val
            count++
          }
        })
        return count > 0 ? sum / count : 0
      }),
      borderColor: COLORS[idx],
      backgroundColor: COLORS[idx] + '40',
      borderWidth: 3,
      tension: 0.4,
      fill: true,
    }))
  }

  // Distribución de mejor bound por dataset
  const bestBoundDistribution = {}
  datasets.forEach(dataset => {
    allWindows.forEach(window => {
      const windowData = data[dataset]?.[window]
      if (windowData?.pruned) {
        const maxPruned = Math.max(...windowData.pruned)
        const bestBound = BOUNDS[windowData.pruned.indexOf(maxPruned)]
        bestBoundDistribution[bestBound] = (bestBoundDistribution[bestBound] || 0) + 1
      }
    })
  })

  const distributionData = {
    labels: BOUNDS,
    datasets: [{
      label: 'Veces que fue el mejor',
      data: BOUNDS.map(bound => bestBoundDistribution[bound] || 0),
      backgroundColor: COLORS,
      borderColor: COLORS,
      borderWidth: 2,
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  }

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>📊 Total de Combinaciones</h3>
          <div className="stat-value">{globalStats.totalTests}</div>
          <div className="stat-subtitle">{globalStats.datasets} datasets × {globalStats.windows} ventanas</div>
        </div>
        <div className="stat-card">
          <h3>🏆 Bound Más Eficiente Global</h3>
          <div className="stat-value-small">{boundGlobalAvg[0]?.bound}</div>
          <div className="stat-subtitle">{boundGlobalAvg[0]?.avgPruned.toFixed(0)} cálculos podados</div>
        </div>
        <div className="stat-card">
          <h3>🎯 Mejor Precisión Global</h3>
          <div className="stat-value-small">
            {boundGlobalAvg.sort((a, b) => b.avgAccuracy - a.avgAccuracy)[0]?.bound}
          </div>
          <div className="stat-subtitle">
            {(boundGlobalAvg.sort((a, b) => b.avgAccuracy - a.avgAccuracy)[0]?.avgAccuracy * 100).toFixed(1)}%
          </div>
        </div>
        <div className="stat-card">
          <h3>⚡ Más Rápido Global</h3>
          <div className="stat-value-small">
            {boundGlobalAvg.sort((a, b) => a.avgTime - b.avgTime)[0]?.bound}
          </div>
          <div className="stat-subtitle">
            {boundGlobalAvg.sort((a, b) => a.avgTime - b.avgTime)[0]?.avgTime.toFixed(2)} ms
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container full-width">
          <h3>🗺️ Mapa de Calor: Eficiencia por Dataset y Ventana</h3>
          <p className="chart-description">
            Promedio de cálculos podados. Más claro = más eficiente
          </p>
          <div className="heatmap">
            <div className="heatmap-header">
              <div className="heatmap-corner"></div>
              {allWindows.map(w => (
                <div key={w} className="heatmap-col-label">w{w.replace('w', '')}</div>
              ))}
            </div>
            {datasets.map((dataset, dIdx) => (
              <div key={dataset} className="heatmap-row">
                <div className="heatmap-row-label">{dataset}</div>
                {heatmapByDataset[dIdx].map((value, wIdx) => {
                  const intensity = maxHeatmap > 0 ? value / maxHeatmap : 0
                  const bgColor = `rgba(102, 126, 234, ${intensity * 0.8 + 0.2})`
                  return (
                    <div 
                      key={wIdx} 
                      className="heatmap-cell"
                      style={{ backgroundColor: bgColor }}
                      title={`${dataset} - w${allWindows[wIdx].replace('w', '')}: ${value.toFixed(0)}`}
                    >
                      {value.toFixed(0)}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="chart-container full-width">
          <h3>📈 Tendencia Global de Eficiencia por Ventana</h3>
          <p className="chart-description">
            Promedio de todos los datasets - muestra cómo cada bound se comporta con diferentes ventanas
          </p>
          <Line data={avgEfficiencyByWindow} options={chartOptions} />
        </div>

        <div className="chart-container">
          <h3>🏆 Distribución: ¿Cuántas veces ganó cada Bound?</h3>
          <p className="chart-description">
            Conteo de veces que cada bound fue el más eficiente
          </p>
          <Bar data={distributionData} options={chartOptions} />
        </div>

        <div className="chart-container">
          <h3>📊 Ranking Global de Bounds</h3>
          <table className="ranking-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Bound</th>
                <th>Eficiencia</th>
                <th>Precisión</th>
                <th>Tiempo</th>
                <th>Tests</th>
              </tr>
            </thead>
            <tbody>
              {boundGlobalAvg.map((item, idx) => (
                <tr key={item.bound}>
                  <td>{idx + 1}</td>
                  <td><strong>{item.bound}</strong></td>
                  <td>{item.avgPruned.toFixed(0)}</td>
                  <td>{(item.avgAccuracy * 100).toFixed(1)}%</td>
                  <td>{item.avgTime.toFixed(2)} ms</td>
                  <td>{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// Vista de todas las ventanas para un dataset
function AllWindowsView({ data, datasetName }) {
  const windows = Object.keys(data).sort()
  
  // Datos para gráfica de evolución de accuracy
  const accuracyEvolutionData = {
    labels: windows.map(w => w.replace('w', '')),
    datasets: BOUNDS.map((bound, idx) => ({
      label: bound,
      data: windows.map(w => data[w]?.accuracy?.[idx] || 0),
      borderColor: COLORS[idx],
      backgroundColor: COLORS[idx] + '40',
      borderWidth: 3,
      tension: 0.4,
      fill: true,
    }))
  }

  // Datos para gráfica de evolución de pruned
  const prunedEvolutionData = {
    labels: windows.map(w => w.replace('w', '')),
    datasets: BOUNDS.map((bound, idx) => ({
      label: bound,
      data: windows.map(w => data[w]?.pruned?.[idx] || 0),
      borderColor: COLORS[idx],
      backgroundColor: COLORS[idx] + '40',
      borderWidth: 3,
      tension: 0.4,
      fill: true,
    }))
  }

  // Datos para gráfica de evolución de tiempos
  const timesEvolutionData = {
    labels: windows.map(w => w.replace('w', '')),
    datasets: BOUNDS.map((bound, idx) => ({
      label: bound,
      data: windows.map(w => data[w]?.times?.[idx] || 0),
      borderColor: COLORS[idx],
      backgroundColor: COLORS[idx] + '40',
      borderWidth: 3,
      tension: 0.4,
      fill: true,
    }))
  }

  // Comparación directa de todas las ventanas
  const allWindowsComparisonData = {
    labels: windows.map(w => w.replace('w', '')),
    datasets: BOUNDS.map((bound, idx) => ({
      label: bound,
      data: windows.map(w => data[w]?.pruned?.[idx] || 0),
      backgroundColor: COLORS[idx],
      borderColor: COLORS[idx],
      borderWidth: 2,
    }))
  }

  // Mejor bound por ventana
  const bestBoundPerWindow = windows.map(w => {
    const windowData = data[w]
    if (!windowData?.pruned) return null
    const maxPruned = Math.max(...windowData.pruned)
    const maxIdx = windowData.pruned.indexOf(maxPruned)
    return {
      window: w,
      bound: BOUNDS[maxIdx],
      pruned: maxPruned,
      accuracy: windowData.accuracy[maxIdx]
    }
  }).filter(Boolean)

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
      },
      x: {
        title: {
          display: true,
          text: 'Tamaño de Ventana (%)'
        }
      }
    }
  }

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>🪟 Ventanas Analizadas</h3>
          <div className="stat-value">{windows.length}</div>
          <div className="stat-subtitle">w1 a w{windows.length}</div>
        </div>
        <div className="stat-card">
          <h3>📊 Dataset</h3>
          <div className="stat-value-small">{datasetName}</div>
        </div>
        <div className="stat-card">
          <h3>🔢 Bounds Comparados</h3>
          <div className="stat-value">{BOUNDS.length}</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container full-width">
          <h3>📈 Evolución de Precisión por Ventana</h3>
          <p className="chart-description">Cómo cambia la precisión de cada bound según el tamaño de ventana</p>
          <Line data={accuracyEvolutionData} options={chartOptions} />
        </div>

        <div className="chart-container full-width">
          <h3>⚡ Evolución de Eficiencia (Cálculos Podados) por Ventana</h3>
          <p className="chart-description">Cuántos cálculos DTW se evitan con cada bound en cada ventana</p>
          <Line data={prunedEvolutionData} options={chartOptions} />
        </div>

        <div className="chart-container full-width">
          <h3>⏱️ Evolución de Tiempo de Ejecución por Ventana</h3>
          <p className="chart-description">Tiempo promedio de clasificación para cada bound y ventana</p>
          <Line data={timesEvolutionData} options={chartOptions} />
        </div>

        <div className="chart-container full-width">
          <h3>📊 Comparación de Eficiencia en Todas las Ventanas</h3>
          <p className="chart-description">Vista comparativa de barras para identificar patrones</p>
          <Bar 
            data={allWindowsComparisonData} 
            options={{
              ...chartOptions,
              scales: {
                ...chartOptions.scales,
                x: {
                  stacked: false,
                  title: {
                    display: true,
                    text: 'Tamaño de Ventana (%)'
                  }
                },
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Cálculos Podados'
                  }
                }
              }
            }} 
          />
        </div>

        <div className="chart-container full-width">
          <h3>🏆 Mejor Bound por Ventana</h3>
          <table className="ranking-table">
            <thead>
              <tr>
                <th>Ventana</th>
                <th>Mejor Bound</th>
                <th>Cálculos Podados</th>
                <th>Precisión</th>
              </tr>
            </thead>
            <tbody>
              {bestBoundPerWindow.map((item) => (
                <tr key={item.window}>
                  <td><strong>w{item.window.replace('w', '')} ({item.window.replace('w', '')}%)</strong></td>
                  <td><span style={{color: COLORS[BOUNDS.indexOf(item.bound)]}}>{item.bound}</span></td>
                  <td>{item.pruned.toFixed(0)}</td>
                  <td>{(item.accuracy * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// Componente de vista comparativa
function ComparisonView({ data, selectedWindow }) {
  const datasets = Object.keys(data)
  
  // Calcular promedios por bound para todos los datasets
  const avgByBound = {
    accuracy: Array(6).fill(0),
    pruned: Array(6).fill(0),
    times: Array(6).fill(0)
  }

  let count = 0
  datasets.forEach(dataset => {
    const windowData = data[dataset][selectedWindow]
    if (windowData) {
      count++
      windowData.accuracy?.forEach((val, idx) => avgByBound.accuracy[idx] += val)
      windowData.pruned?.forEach((val, idx) => avgByBound.pruned[idx] += val)
      windowData.times?.forEach((val, idx) => avgByBound.times[idx] += val)
    }
  })

  if (count > 0) {
    avgByBound.accuracy = avgByBound.accuracy.map(v => v / count)
    avgByBound.pruned = avgByBound.pruned.map(v => v / count)
    avgByBound.times = avgByBound.times.map(v => v / count)
  }

  // Gráfica de promedio de accuracy
  const avgAccuracyData = {
    labels: BOUNDS,
    datasets: [{
      label: 'Precisión Promedio',
      data: avgByBound.accuracy,
      backgroundColor: COLORS,
      borderColor: COLORS.map(c => c + 'CC'),
      borderWidth: 2,
    }]
  }

  // Gráfica de promedio de pruned
  const avgPrunedData = {
    labels: BOUNDS,
    datasets: [{
      label: 'Cálculos Podados Promedio',
      data: avgByBound.pruned,
      backgroundColor: COLORS,
      borderColor: COLORS.map(c => c + 'CC'),
      borderWidth: 2,
    }]
  }

  // Gráfica comparativa de todos los datasets (Pruned por dataset)
  const allDatasetsData = {
    labels: datasets,
    datasets: BOUNDS.map((bound, idx) => ({
      label: bound,
      data: datasets.map(ds => {
        const windowData = data[ds][selectedWindow]
        return windowData?.pruned?.[idx] || 0
      }),
      backgroundColor: COLORS[idx] + '80',
      borderColor: COLORS[idx],
      borderWidth: 2,
    }))
  }

  // Ranking de bounds por eficiencia
  const boundRanking = BOUNDS.map((bound, idx) => ({
    bound,
    avgPruned: avgByBound.pruned[idx],
    avgAccuracy: avgByBound.accuracy[idx],
    avgTime: avgByBound.times[idx]
  })).sort((a, b) => b.avgPruned - a.avgPruned)

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  }

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>📊 Datasets Analizados</h3>
          <div className="stat-value">{datasets.length}</div>
        </div>
        <div className="stat-card">
          <h3>🏆 Bound Más Eficiente</h3>
          <div className="stat-value">{boundRanking[0]?.bound}</div>
          <div className="stat-subtitle">{boundRanking[0]?.avgPruned.toFixed(0)} cálculos podados</div>
        </div>
        <div className="stat-card">
          <h3>⚡ Mejor Precisión</h3>
          <div className="stat-value">
            {BOUNDS[avgByBound.accuracy.indexOf(Math.max(...avgByBound.accuracy))]}
          </div>
          <div className="stat-subtitle">{(Math.max(...avgByBound.accuracy) * 100).toFixed(1)}%</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3>📊 Precisión Promedio por Bound</h3>
          <Bar data={avgAccuracyData} options={chartOptions} />
        </div>

        <div className="chart-container">
          <h3>⚡ Eficiencia Promedio por Bound</h3>
          <Bar data={avgPrunedData} options={chartOptions} />
        </div>

        <div className="chart-container full-width">
          <h3>📈 Comparación de Eficiencia por Dataset</h3>
          <Bar 
            data={allDatasetsData} 
            options={{
              ...chartOptions,
              indexAxis: datasets.length > 5 ? 'y' : 'x',
            }} 
          />
        </div>

        <div className="chart-container full-width">
          <h3>🏆 Ranking de Bounds por Eficiencia</h3>
          <table className="ranking-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Bound</th>
                <th>Cálculos Podados</th>
                <th>Precisión</th>
                <th>Tiempo (ms)</th>
              </tr>
            </thead>
            <tbody>
              {boundRanking.map((item, idx) => (
                <tr key={item.bound}>
                  <td>{idx + 1}</td>
                  <td><strong>{item.bound}</strong></td>
                  <td>{item.avgPruned.toFixed(0)}</td>
                  <td>{(item.avgAccuracy * 100).toFixed(1)}%</td>
                  <td>{item.avgTime.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export default App
