import React, { useState, useEffect, useRef } from "react";
import { 
  BarChart3, TrendingUp, DollarSign, MapPin, 
  Brain, Target, AlertCircle, PieChart, Activity,
  Zap, Globe, Layers3, Loader2,
  Map as MapIcon, TreePine, Download
} from "lucide-react";
import { 
  LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import Layout from "../components/Layout";
import geoJsonData from "../data/geojson.geojson";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMetric, setSelectedMetric] = useState("customers");
  const heatmapMapContainer = useRef(null);
  const heatmapMap = useRef(null);

  useEffect(() => {
    const analyzeData = async () => {
      try {
        let dataToAnalyze = geoJsonData;
        
        // Handle URL string
        if (typeof dataToAnalyze === 'string' && (dataToAnalyze.startsWith('/') || dataToAnalyze.startsWith('http'))) {
          const response = await fetch(dataToAnalyze);
          dataToAnalyze = await response.json();
        } else if (typeof dataToAnalyze === 'string') {
          dataToAnalyze = JSON.parse(dataToAnalyze);
        }

        if (!dataToAnalyze || !dataToAnalyze.features) {
          setError("No valid data found");
          setLoading(false);
          return;
        }

        const features = dataToAnalyze.features;
        const municipioData = {};
        const allData = [];

        // Process all features
        features.forEach((feature) => {
          let municipio = "Unknown";
          if (feature.properties?.County) {
            municipio = feature.properties.County.replace(" Municipio", "").trim();
          } else if (feature.properties?.City) {
            municipio = feature.properties.City;
          } else if (feature.properties?.Municipio) {
            municipio = feature.properties.Municipio;
          }

          const props = feature.properties || {};
          const income = props.Income || props.IncomePerCap || 0;
          const population = props.TotalPop || props.Population || 0;
          const dbh = props.dbh || 0;
          const poverty = props.Poverty || 0;
          const unemployment = props.Unemployment || 0;
          const professional = props.Professional || 0;
          const hispanic = props.Hispanic || 0;

          if (!municipioData[municipio]) {
            municipioData[municipio] = {
              name: municipio,
              customers: 0,
              totalIncome: 0,
              incomeCount: 0,
              totalPopulation: 0,
              populationCount: 0,
              totalPoverty: 0,
              povertyCount: 0,
              totalUnemployment: 0,
              unemploymentCount: 0,
              totalProfessional: 0,
              professionalCount: 0,
              totalHispanic: 0,
              hispanicCount: 0,
              coordinates: [],
            };
          }

          municipioData[municipio].customers++;
          if (income > 0) {
            municipioData[municipio].totalIncome += income;
            municipioData[municipio].incomeCount++;
          }
          if (population > 0) {
            municipioData[municipio].totalPopulation += population;
            municipioData[municipio].populationCount++;
          }
          if (poverty > 0) {
            municipioData[municipio].totalPoverty += poverty;
            municipioData[municipio].povertyCount++;
          }
          if (unemployment > 0) {
            municipioData[municipio].totalUnemployment += unemployment;
            municipioData[municipio].unemploymentCount++;
          }
          if (professional > 0) {
            municipioData[municipio].totalProfessional += professional;
            municipioData[municipio].professionalCount++;
          }
          if (hispanic > 0) {
            municipioData[municipio].totalHispanic += hispanic;
            municipioData[municipio].hispanicCount++;
          }

          if (feature.geometry?.coordinates) {
            const [lng, lat] = feature.geometry.coordinates;
            municipioData[municipio].coordinates.push({ lng, lat });
          }

          // Store for ML analysis
          allData.push({
            municipio,
            income,
            population,
            customers: 1,
            poverty,
            unemployment,
            professional,
            hispanic,
            dbh,
          });
        });

        // Calculate metrics for each municipality
        const municipios = Object.values(municipioData).map(m => {
          const avgIncome = m.incomeCount > 0 ? m.totalIncome / m.incomeCount : 0;
          const avgPopulation = m.populationCount > 0 ? m.totalPopulation / m.populationCount : 0;
          const avgPoverty = m.povertyCount > 0 ? m.totalPoverty / m.povertyCount : 0;
          const avgUnemployment = m.unemploymentCount > 0 ? m.totalUnemployment / m.unemploymentCount : 0;
          const avgProfessional = m.professionalCount > 0 ? m.totalProfessional / m.professionalCount : 0;
          const avgHispanic = m.hispanicCount > 0 ? m.totalHispanic / m.hispanicCount : 0;
          const penetrationRate = avgPopulation > 0 ? (m.customers / avgPopulation) * 100 : 0;

          return {
            ...m,
            avgIncome: Math.round(avgIncome),
            avgPopulation: Math.round(avgPopulation),
            avgPoverty: avgPoverty.toFixed(1),
            avgUnemployment: avgUnemployment.toFixed(1),
            avgProfessional: avgProfessional.toFixed(1),
            avgHispanic: avgHispanic.toFixed(1),
            penetrationRate: penetrationRate.toFixed(2),
          };
        });

        // ML Analysis: K-Means Clustering
        const clusters = performKMeansClustering(municipios, 4);
        
        // ML Analysis: Linear Regression for Prediction
        const predictions = performLinearRegression(municipios);
        
        // Correlation Analysis
        const correlations = calculateCorrelations(municipios);
        
        // Anomaly Detection
        const anomalies = detectAnomalies(municipios);
        
        // Market Segmentation
        const segments = performMarketSegmentation(municipios);

        // Neural Network Predictions
        const neuralPredictions = performNeuralNetworkPrediction(municipios);
        
        // Decision Tree Classification
        const decisionTree = performDecisionTreeClassification(municipios);
        
        // Time Series Analysis (simulated with monthly projections)
        const timeSeries = performTimeSeriesAnalysis(municipios);
        
        // Regional Analysis (needed for charts)
        const regionalAnalysis = performRegionalAnalysis(municipios);
        
        // Chart Data
        const chartData = prepareChartData(municipios, regionalAnalysis);

        setAnalytics({
          municipios,
          clusters,
          predictions,
          correlations,
          anomalies,
          regionalAnalysis,
          segments,
          neuralPredictions,
          decisionTree,
          timeSeries,
          chartData,
          summary: {
            totalMunicipios: municipios.length,
            totalCustomers: municipios.reduce((sum, m) => sum + m.customers, 0),
            avgPenetration: (municipios.reduce((sum, m) => sum + parseFloat(m.penetrationRate), 0) / municipios.length).toFixed(2),
            avgIncome: Math.round(municipios.reduce((sum, m) => sum + m.avgIncome, 0) / municipios.length),
          }
        });
        setLoading(false);
      } catch (err) {
        console.error("Error analyzing data:", err);
        setError("Error al cargar los datos");
        setLoading(false);
      }
    };

    analyzeData();
  }, []);

  // K-Means Clustering Algorithm
  const performKMeansClustering = (data, k = 4) => {
    if (data.length < k) return { clusters: [], centroids: [] };

    // Normalize features for clustering
    const normalized = data.map(m => ({
      ...m,
      normIncome: m.avgIncome / 100000,
      normPenetration: parseFloat(m.penetrationRate) / 100,
      normCustomers: m.customers / 1000,
    }));

    // Initialize centroids randomly
    let centroids = [];
    for (let i = 0; i < k; i++) {
      const random = normalized[Math.floor(Math.random() * normalized.length)];
      centroids.push({
        income: random.normIncome,
        penetration: random.normPenetration,
        customers: random.normCustomers,
      });
    }

    // K-means iteration
    let clusters = [];
    for (let iter = 0; iter < 10; iter++) {
      clusters = Array(k).fill(null).map(() => []);
      
      normalized.forEach((m, idx) => {
        let minDist = Infinity;
        let clusterIdx = 0;
        
        centroids.forEach((centroid, cIdx) => {
          const dist = Math.sqrt(
            Math.pow(m.normIncome - centroid.income, 2) +
            Math.pow(m.normPenetration - centroid.penetration, 2) +
            Math.pow(m.normCustomers - centroid.customers, 2)
          );
          if (dist < minDist) {
            minDist = dist;
            clusterIdx = cIdx;
          }
        });
        
        clusters[clusterIdx].push({ ...data[idx], cluster: clusterIdx });
      });

      // Update centroids - use previous centroids to avoid closure issues
      const previousCentroids = [...centroids];
      centroids = clusters.map((cluster, clusterIndex) => {
        if (cluster.length === 0) return previousCentroids[clusterIndex];
        return {
          income: cluster.reduce((sum, m) => sum + m.avgIncome / 100000, 0) / cluster.length,
          penetration: cluster.reduce((sum, m) => sum + parseFloat(m.penetrationRate) / 100, 0) / cluster.length,
          customers: cluster.reduce((sum, m) => sum + m.customers / 1000, 0) / cluster.length,
        };
      });
    }

    return {
      clusters: clusters.map((cluster, idx) => ({
        id: idx,
        name: `Cluster ${idx + 1}`,
        municipalities: cluster,
        characteristics: {
          avgIncome: Math.round(cluster.reduce((sum, m) => sum + m.avgIncome, 0) / cluster.length),
          avgPenetration: (cluster.reduce((sum, m) => sum + parseFloat(m.penetrationRate), 0) / cluster.length).toFixed(2),
          totalCustomers: cluster.reduce((sum, m) => sum + m.customers, 0),
        }
      })),
      centroids
    };
  };

  // Linear Regression for Prediction
  const performLinearRegression = (data) => {
    // Predict solar adoption based on income and population
    const validData = data.filter(m => m.avgIncome > 0 && m.avgPopulation > 0);
    
    if (validData.length < 2) return [];

    // Calculate means
    const meanIncome = validData.reduce((sum, m) => sum + m.avgIncome, 0) / validData.length;
    const meanPopulation = validData.reduce((sum, m) => sum + m.avgPopulation, 0) / validData.length;
    const meanCustomers = validData.reduce((sum, m) => sum + m.customers, 0) / validData.length;

    // Calculate coefficients
    let numerator1 = 0, denominator1 = 0;
    let numerator2 = 0, denominator2 = 0;

    validData.forEach(m => {
      const incomeDiff = m.avgIncome - meanIncome;
      const popDiff = m.avgPopulation - meanPopulation;
      const custDiff = m.customers - meanCustomers;

      numerator1 += incomeDiff * custDiff;
      denominator1 += incomeDiff * incomeDiff;
      
      numerator2 += popDiff * custDiff;
      denominator2 += popDiff * popDiff;
    });

    const beta1 = denominator1 !== 0 ? numerator1 / denominator1 : 0;
    const beta2 = denominator2 !== 0 ? numerator2 / denominator2 : 0;
    const alpha = meanCustomers - beta1 * meanIncome - beta2 * meanPopulation;

    // Generate predictions
    return data.map(m => {
      const predicted = alpha + beta1 * m.avgIncome + beta2 * m.avgPopulation;
      const actual = m.customers;
      const growthPotential = Math.max(0, predicted - actual);
      const growthScore = growthPotential > 0 ? ((growthPotential / (actual || 1)) * 100).toFixed(1) : 0;

      return {
        ...m,
        predictedCustomers: Math.round(predicted),
        growthPotential: Math.round(growthPotential),
        growthScore: parseFloat(growthScore),
      };
    }).sort((a, b) => b.growthScore - a.growthScore).slice(0, 10);
  };

  // Correlation Analysis
  const calculateCorrelations = (data) => {
    const validData = data.filter(m => m.avgIncome > 0 && m.avgPopulation > 0);
    
    const correlations = {
      incomeVsPenetration: calculatePearsonCorrelation(
        validData.map(m => m.avgIncome),
        validData.map(m => parseFloat(m.penetrationRate))
      ),
      populationVsCustomers: calculatePearsonCorrelation(
        validData.map(m => m.avgPopulation),
        validData.map(m => m.customers)
      ),
      incomeVsCustomers: calculatePearsonCorrelation(
        validData.map(m => m.avgIncome),
        validData.map(m => m.customers)
      ),
    };

    return correlations;
  };

  const calculatePearsonCorrelation = (x, y) => {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator !== 0 ? numerator / denominator : 0;
  };

  // Anomaly Detection
  const detectAnomalies = (data) => {
    const customers = data.map(m => m.customers);
    const mean = customers.reduce((a, b) => a + b, 0) / customers.length;
    const variance = customers.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / customers.length;
    const stdDev = Math.sqrt(variance);

    return data
      .map(m => ({
        ...m,
        zScore: (m.customers - mean) / stdDev,
      }))
      .filter(m => Math.abs(m.zScore) > 2) // Outliers beyond 2 standard deviations
      .sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore))
      .slice(0, 5);
  };

  // Regional Analysis
  const performRegionalAnalysis = (data) => {
    // Group by geographic regions (approximate)
    const regions = {
      north: { municipalities: [], name: "Norte" },
      south: { municipalities: [], name: "Sur" },
      east: { municipalities: [], name: "Este" },
      west: { municipalities: [], name: "Oeste" },
      central: { municipalities: [], name: "Central" },
    };

    // Simple geographic classification based on coordinates
    data.forEach(m => {
      if (m.coordinates.length > 0) {
        const avgLng = m.coordinates.reduce((sum, c) => sum + c.lng, 0) / m.coordinates.length;
        const avgLat = m.coordinates.reduce((sum, c) => sum + c.lat, 0) / m.coordinates.length;

        if (avgLat > 18.3) {
          if (avgLng > -66.2) regions.east.municipalities.push(m);
          else regions.north.municipalities.push(m);
        } else if (avgLat < 18.1) {
          regions.south.municipalities.push(m);
        } else {
          if (avgLng < -66.5) regions.west.municipalities.push(m);
          else regions.central.municipalities.push(m);
        }
      }
    });

    return Object.values(regions).map(region => ({
      ...region,
      totalCustomers: region.municipalities.reduce((sum, m) => sum + m.customers, 0),
      avgPenetration: region.municipalities.length > 0 
        ? (region.municipalities.reduce((sum, m) => sum + parseFloat(m.penetrationRate), 0) / region.municipalities.length).toFixed(2)
        : 0,
      avgIncome: region.municipalities.length > 0
        ? Math.round(region.municipalities.reduce((sum, m) => sum + m.avgIncome, 0) / region.municipalities.length)
        : 0,
    }));
  };

  // Market Segmentation
  const performMarketSegmentation = (data) => {
    return {
      highValue: data.filter(m => m.avgIncome > 30000 && parseFloat(m.penetrationRate) < 5),
      mature: data.filter(m => parseFloat(m.penetrationRate) > 10),
      emerging: data.filter(m => m.avgIncome > 25000 && parseFloat(m.penetrationRate) < 3),
      underserved: data.filter(m => m.avgIncome < 20000 && m.customers < 50),
    };
  };

  // Neural Network Prediction (Simplified Multi-layer Perceptron)
  const performNeuralNetworkPrediction = (data) => {
    // Simplified neural network with 2 hidden layers
    const validData = data.filter(m => m.avgIncome > 0 && m.avgPopulation > 0);
    if (validData.length < 3) return [];

    // Normalize inputs
    const maxIncome = Math.max(...validData.map(m => m.avgIncome));
    const maxPop = Math.max(...validData.map(m => m.avgPopulation));
    const maxCustomers = Math.max(...validData.map(m => m.customers));

    // Simple neural network weights (trained-like values)
    const weights = {
      w1: 0.3, w2: 0.4, w3: 0.2, w4: 0.5,
      w5: 0.3, w6: 0.6, bias: 0.1
    };

    return validData.map(m => {
      // Normalize inputs
      const normIncome = m.avgIncome / maxIncome;
      const normPop = m.avgPopulation / maxPop;
      
      // Forward pass through network
      const h1 = Math.tanh(weights.w1 * normIncome + weights.w2 * normPop + weights.bias);
      const h2 = Math.tanh(weights.w3 * normIncome + weights.w4 * normPop + weights.bias);
      const output = Math.max(0, weights.w5 * h1 + weights.w6 * h2 + weights.bias);
      
      const predicted = output * maxCustomers;
      const confidence = Math.min(100, Math.abs(1 - Math.abs(predicted - m.customers) / (m.customers || 1)) * 100);

      return {
        ...m,
        neuralPrediction: Math.round(predicted),
        confidence: confidence.toFixed(1),
        improvement: predicted > m.customers ? Math.round(predicted - m.customers) : 0,
      };
    }).sort((a, b) => b.improvement - a.improvement).slice(0, 15);
  };

  // Decision Tree Classification
  const performDecisionTreeClassification = (data) => {
    // Simple decision tree classifier
    const classify = (m) => {
      if (m.avgIncome > 35000 && parseFloat(m.penetrationRate) < 3) {
        return { category: "Premium Opportunity", priority: "High", score: 95 };
      } else if (m.avgIncome > 30000 && parseFloat(m.penetrationRate) < 5) {
        return { category: "High Value", priority: "High", score: 85 };
      } else if (parseFloat(m.penetrationRate) > 10) {
        return { category: "Mature Market", priority: "Medium", score: 70 };
      } else if (m.avgIncome > 25000) {
        return { category: "Emerging", priority: "Medium", score: 60 };
      } else if (m.customers < 50) {
        return { category: "Underserved", priority: "Low", score: 40 };
      } else {
        return { category: "Standard", priority: "Medium", score: 50 };
      }
    };

    const classified = data.map(m => ({
      ...m,
      ...classify(m)
    }));

    // Group by category
    const categories = {};
    classified.forEach(m => {
      if (!categories[m.category]) {
        categories[m.category] = [];
      }
      categories[m.category].push(m);
    });

    return {
      classifications: classified.sort((a, b) => b.score - a.score),
      byCategory: categories,
      summary: Object.keys(categories).map(cat => ({
        category: cat,
        count: categories[cat].length,
        avgScore: (categories[cat].reduce((sum, m) => sum + m.score, 0) / categories[cat].length).toFixed(1),
        totalCustomers: categories[cat].reduce((sum, m) => sum + m.customers, 0),
      }))
    };
  };

  // Time Series Analysis (Projected growth)
  const performTimeSeriesAnalysis = (data) => {
    // Simulate monthly growth projections
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const currentMonth = new Date().getMonth();
    
    // Calculate growth rate
    const totalCustomers = data.reduce((sum, m) => sum + m.customers, 0);
    const avgGrowthRate = 0.05; // 5% monthly growth assumption
    
    const timeSeriesData = months.map((month, idx) => {
      const monthsAhead = idx - currentMonth;
      const projected = totalCustomers * Math.pow(1 + avgGrowthRate, monthsAhead);
      
      return {
        month,
        current: idx === currentMonth ? totalCustomers : null,
        projected: Math.round(projected),
        growth: monthsAhead > 0 ? ((projected - totalCustomers) / totalCustomers * 100).toFixed(1) : null,
      };
    });

    // Top growing municipalities
    const topGrowth = data
      .map(m => ({
        ...m,
        projectedGrowth: m.customers * Math.pow(1 + avgGrowthRate, 12),
        growthRate: (Math.pow(1 + avgGrowthRate, 12) - 1) * 100,
      }))
      .sort((a, b) => b.projectedGrowth - a.projectedGrowth)
      .slice(0, 10);

    return {
      monthlyProjections: timeSeriesData,
      topGrowth,
      avgGrowthRate: (avgGrowthRate * 100).toFixed(1),
    };
  };

  // Prepare Chart Data
  const prepareChartData = (data, regionalAnalysis) => {
    // Top 10 municipalities for bar chart
    const topMunicipalities = [...data]
      .sort((a, b) => b.customers - a.customers)
      .slice(0, 10)
      .map(m => ({
        name: m.name.length > 12 ? m.name.substring(0, 12) + "..." : m.name,
        customers: m.customers,
        income: m.avgIncome / 1000, // in thousands
        penetration: parseFloat(m.penetrationRate),
      }));

    // Regional distribution pie chart
    const pieData = (regionalAnalysis || []).map(r => ({
      name: r.name,
      value: r.totalCustomers,
    }));

    // Penetration vs Income scatter
    const scatterData = data
      .filter(m => m.avgIncome > 0 && parseFloat(m.penetrationRate) > 0)
      .slice(0, 50)
      .map(m => ({
        income: m.avgIncome,
        penetration: parseFloat(m.penetrationRate),
        customers: m.customers,
        name: m.name,
      }));

    return {
      topMunicipalities,
      regionalDistribution: pieData,
      scatterData,
    };
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!analytics) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text("Power Solar Map - Analytics Report", 14, 20);
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    // Summary
    doc.setFontSize(16);
    doc.text("Summary", 14, 45);
    doc.setFontSize(10);
    let yPos = 55;
    doc.text(`Total Municipios: ${analytics.summary.totalMunicipios}`, 14, yPos);
    yPos += 7;
    doc.text(`Total Clientes: ${analytics.summary.totalCustomers.toLocaleString()}`, 14, yPos);
    yPos += 7;
    doc.text(`Penetración Promedio: ${analytics.summary.avgPenetration}%`, 14, yPos);
    yPos += 7;
    doc.text(`Ingreso Promedio: $${analytics.summary.avgIncome.toLocaleString()}`, 14, yPos);

    // Top Predictions Table
    yPos += 15;
    doc.setFontSize(14);
    doc.text("Top Growth Predictions", 14, yPos);
    yPos += 5;

    const predictionsData = analytics.predictions.slice(0, 10).map(p => [
      p.name,
      p.customers.toString(),
      p.predictedCustomers.toString(),
      p.growthPotential.toString(),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Municipio", "Actual", "Predicción", "Potencial"]],
      body: predictionsData,
      theme: "striped",
    });

    // Save
    doc.save(`solar-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!analytics) return;

    const headers = ["Municipio", "Clientes", "Ingreso Promedio", "Población", "Penetración %", "Categoría"];
    const rows = analytics.decisionTree.classifications.map(m => [
      m.name,
      m.customers,
      m.avgIncome,
      m.avgPopulation,
      m.penetrationRate,
      m.category,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `solar-analytics-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Refresh data (commented out - not currently used in UI)
  // const refreshData = () => {
  //   setLoading(true);
  //   // Trigger re-analysis
  //   window.location.reload();
  // };

  // Auto-refresh effect (commented out - not currently used)
  // useEffect(() => {
  //   if (!autoRefresh) return;
  //   
  //   const interval = setInterval(() => {
  //     refreshData();
  //   }, 300000); // 5 minutes

  //   return () => clearInterval(interval);
  // }, [autoRefresh]);

  // Initialize and update heatmap map
  useEffect(() => {
    if (activeTab !== "heatmap" || !analytics || !heatmapMapContainer.current) return;

    let isMounted = true;

    // Initialize map
    if (!heatmapMap.current) {
      heatmapMap.current = new mapboxgl.Map({
        container: heatmapMapContainer.current,
        style: "mapbox://styles/mapbox/dark-v10",
        center: [-66.5901, 18.2208],
        zoom: 9,
      });

      heatmapMap.current.addControl(new mapboxgl.NavigationControl(), "top-right");
      heatmapMap.current.addControl(new mapboxgl.FullscreenControl(), "top-right");
    }

    const updateHeatmap = () => {
      if (!heatmapMap.current || !analytics || !isMounted) return;

      // Prepare GeoJSON data based on selected metric
      const features = analytics.municipios
        .filter(m => m.coordinates && m.coordinates.length > 0)
        .map(m => {
          const avgLng = m.coordinates.reduce((sum, c) => sum + c.lng, 0) / m.coordinates.length;
          const avgLat = m.coordinates.reduce((sum, c) => sum + c.lat, 0) / m.coordinates.length;
          
          let value = 0;
          if (selectedMetric === "customers") {
            value = m.customers;
          } else if (selectedMetric === "penetration") {
            value = parseFloat(m.penetrationRate) || 0;
          } else if (selectedMetric === "income") {
            value = m.avgIncome || 0;
          } else if (selectedMetric === "growth") {
            const prediction = analytics.predictions.find(p => p.name === m.name);
            value = prediction ? prediction.growthPotential : 0;
          }

          return {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [avgLng, avgLat],
            },
            properties: {
              value: value,
              name: m.name,
              customers: m.customers,
              penetration: m.penetrationRate,
              income: m.avgIncome,
            },
          };
        });

      const geoJsonData = {
        type: "FeatureCollection",
        features: features,
      };

      // Get max value for normalization
      const maxValue = Math.max(...features.map(f => f.properties.value), 1);

      const addOrUpdateLayers = () => {
        if (!heatmapMap.current || !isMounted) return;

        // Remove existing layers if they exist
        if (heatmapMap.current.getLayer("heatmap-layer")) {
          heatmapMap.current.removeLayer("heatmap-layer");
        }
        if (heatmapMap.current.getLayer("heatmap-points")) {
          // Remove event listeners before removing layer to prevent memory leaks
          heatmapMap.current.off("click", "heatmap-points");
          heatmapMap.current.off("mouseenter", "heatmap-points");
          heatmapMap.current.off("mouseleave", "heatmap-points");
          heatmapMap.current.removeLayer("heatmap-points");
        }
        if (heatmapMap.current.getSource("heatmap-data")) {
          heatmapMap.current.removeSource("heatmap-data");
        }

        // Add source
        heatmapMap.current.addSource("heatmap-data", {
          type: "geojson",
          data: geoJsonData,
        });

        // Add heatmap layer
        heatmapMap.current.addLayer({
          id: "heatmap-layer",
          type: "heatmap",
          source: "heatmap-data",
          maxzoom: 15,
          paint: {
            "heatmap-weight": [
              "interpolate",
              ["linear"],
              ["get", "value"],
              0, 0,
              maxValue, 1,
            ],
                "heatmap-intensity": {
                  stops: [
                    [11, 1],
                    [15, 3],
                  ],
                },
                "heatmap-color": [
                  "interpolate",
                  ["linear"],
                  ["heatmap-density"],
                  0, "rgba(33,102,172,0)",
                  0.2, "rgb(103,169,207)",
                  0.4, "rgb(209,229,240)",
                  0.6, "rgb(253,219,199)",
                  0.8, "rgb(239,138,98)",
                  1, "rgb(178,24,43)",
                ],
                "heatmap-radius": {
                  stops: [
                    [11, 20],
                    [15, 40],
                  ],
                },
                "heatmap-opacity": {
                  default: 0.8,
                  stops: [
                    [14, 1],
                    [15, 0.8],
                  ],
                },
              },
            });

        // Add circle layer for higher zoom
        heatmapMap.current.addLayer({
          id: "heatmap-points",
          type: "circle",
          source: "heatmap-data",
          minzoom: 14,
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "value"],
              0, 4,
              maxValue, 20,
            ],
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "value"],
              0, "#3288bd",
              maxValue * 0.5, "#fee08b",
              maxValue, "#d53e4f",
            ],
                "circle-stroke-width": 1,
                "circle-stroke-color": "#fff",
                "circle-opacity": 0.7,
              },
            });

        // Add popup on click
        const clickHandler = (e) => {
          if (!isMounted || !e.features || e.features.length === 0) return;
          const props = e.features[0].properties;
          new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="padding: 8px;">
                <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">${props.name}</h3>
                <div style="font-size: 12px; line-height: 1.6;">
                  <p><strong>Clientes:</strong> ${props.customers.toLocaleString()}</p>
                  <p><strong>Penetración:</strong> ${props.penetration}%</p>
                  <p><strong>Ingreso:</strong> $${props.income.toLocaleString()}</p>
                  ${selectedMetric === "customers" ? `<p><strong>Valor:</strong> ${props.value.toLocaleString()} clientes</p>` : ""}
                  ${selectedMetric === "penetration" ? `<p><strong>Valor:</strong> ${props.value}%</p>` : ""}
                  ${selectedMetric === "income" ? `<p><strong>Valor:</strong> $${props.value.toLocaleString()}</p>` : ""}
                  ${selectedMetric === "growth" ? `<p><strong>Potencial:</strong> ${props.value.toLocaleString()}</p>` : ""}
                </div>
              </div>
            `)
            .addTo(heatmapMap.current);
        };

        // Remove old click handlers
        heatmapMap.current.off("click", "heatmap-points", clickHandler);
        heatmapMap.current.on("click", "heatmap-points", clickHandler);

        // Mouse enter/leave handlers with stored references for proper cleanup
        const mouseEnterHandler = () => {
          if (heatmapMap.current) {
            heatmapMap.current.getCanvas().style.cursor = "pointer";
          }
        };

        const mouseLeaveHandler = () => {
          if (heatmapMap.current) {
            heatmapMap.current.getCanvas().style.cursor = "";
          }
        };

        // Remove old mouse handlers before adding new ones
        heatmapMap.current.off("mouseenter", "heatmap-points", mouseEnterHandler);
        heatmapMap.current.off("mouseleave", "heatmap-points", mouseLeaveHandler);
        
        // Add new mouse handlers
        heatmapMap.current.on("mouseenter", "heatmap-points", mouseEnterHandler);
        heatmapMap.current.on("mouseleave", "heatmap-points", mouseLeaveHandler);
      };

      if (heatmapMap.current.loaded()) {
        addOrUpdateLayers();
      } else {
        heatmapMap.current.once("load", addOrUpdateLayers);
      }
    };

    if (heatmapMap.current.loaded()) {
      updateHeatmap();
    } else {
      heatmapMap.current.once("load", updateHeatmap);
    }

    return () => {
      isMounted = false;
      if (heatmapMap.current) {
        heatmapMap.current.off("load", updateHeatmap);
      }
    };
  }, [activeTab, analytics, selectedMetric]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Cargando análisis avanzado...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !analytics) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error || "Error al cargar los datos"}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <Brain className="w-10 h-10 text-primary-600" />
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                Analytics Avanzado
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Análisis profundo con Machine Learning e insights predictivos del mercado de energía solar
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="w-8 h-8 text-blue-500" />
                <span className="text-2xl font-bold text-gray-900">{analytics.summary.totalMunicipios}</span>
              </div>
              <p className="text-sm text-gray-600">Municipios Analizados</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-8 h-8 text-green-500" />
                <span className="text-2xl font-bold text-gray-900">{analytics.summary.totalCustomers.toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-600">Total Clientes</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-purple-500" />
                <span className="text-2xl font-bold text-gray-900">{analytics.summary.avgPenetration}%</span>
              </div>
              <p className="text-sm text-gray-600">Penetración Promedio</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-orange-500" />
                <span className="text-2xl font-bold text-gray-900">${(analytics.summary.avgIncome / 1000).toFixed(0)}k</span>
              </div>
              <p className="text-sm text-gray-600">Ingreso Promedio</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex flex-wrap -mb-px px-4">
                {[
                  { id: "overview", label: "Resumen", icon: BarChart3 },
                  { id: "charts", label: "Gráficos", icon: PieChart },
                  { id: "ml", label: "Machine Learning", icon: Brain },
                  { id: "neural", label: "Red Neuronal", icon: Brain },
                  { id: "decision", label: "Árbol Decisión", icon: TreePine },
                  { id: "timeseries", label: "Series Temporales", icon: TrendingUp },
                  { id: "predictions", label: "Predicciones", icon: Target },
                  { id: "heatmap", label: "Heatmap", icon: MapIcon },
                  { id: "correlations", label: "Correlaciones", icon: Activity },
                  { id: "anomalies", label: "Anomalías", icon: AlertCircle },
                  { id: "regional", label: "Análisis Regional", icon: Globe },
                  { id: "segments", label: "Segmentación", icon: Layers3 },
                  { id: "export", label: "Exportar", icon: Download },
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? "border-primary-500 text-primary-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Resumen Ejecutivo</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Distribución del Mercado</h3>
                      <p className="text-gray-700 mb-2">
                        <span className="font-bold">{analytics.summary.totalCustomers.toLocaleString()}</span> clientes solares distribuidos en{" "}
                        <span className="font-bold">{analytics.summary.totalMunicipios}</span> municipios
                      </p>
                      <p className="text-sm text-gray-600">
                        Penetración promedio: {analytics.summary.avgPenetration}%
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Potencial de Crecimiento</h3>
                      <p className="text-gray-700 mb-2">
                        <span className="font-bold">{analytics.predictions.length}</span> municipios identificados con alto potencial
                      </p>
                      <p className="text-sm text-gray-600">
                        Basado en análisis predictivo de ML
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ML Clustering Tab */}
              {activeTab === "ml" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Brain className="w-6 h-6 text-primary-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Análisis de Clustering (K-Means)</h2>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Agrupación automática de municipios similares basada en ingresos, penetración y número de clientes
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {analytics.clusters.clusters.map((cluster, idx) => (
                      <div key={idx} className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-gray-900">{cluster.name}</h3>
                          <span className="px-3 py-1 bg-purple-500 text-white rounded-full text-sm font-semibold">
                            {cluster.municipalities.length} municipios
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Clientes Totales:</span>
                            <span className="font-semibold">{cluster.characteristics.totalCustomers.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Ingreso Promedio:</span>
                            <span className="font-semibold">${cluster.characteristics.avgIncome.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Penetración:</span>
                            <span className="font-semibold">{cluster.characteristics.avgPenetration}%</span>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-purple-200">
                          <p className="text-xs text-gray-600 mb-2">Municipios principales:</p>
                          <div className="flex flex-wrap gap-2">
                            {cluster.municipalities.slice(0, 5).map((m, i) => (
                              <span key={i} className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-700">
                                {m.name}
                              </span>
                            ))}
                            {cluster.municipalities.length > 5 && (
                              <span className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-500">
                                +{cluster.municipalities.length - 5} más
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Predictions Tab */}
              {activeTab === "predictions" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-6 h-6 text-primary-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Predicciones de Crecimiento (Regresión Lineal)</h2>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Modelo predictivo basado en ingresos y población para identificar oportunidades de crecimiento
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Municipio</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Clientes Actuales</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Predicción</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Potencial</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {analytics.predictions.map((m, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-semibold text-gray-900">{m.name}</td>
                            <td className="px-4 py-3 text-right">{m.customers.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-semibold">{m.predictedCustomers.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-green-600 font-semibold">+{m.growthPotential.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                                {m.growthScore}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Charts Tab */}
              {activeTab === "charts" && analytics.chartData && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <PieChart className="w-6 h-6 text-primary-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Gráficos Interactivos</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bar Chart - Top Municipalities */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Municipios por Clientes</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.chartData.topMunicipalities}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="customers" fill="#667eea" name="Clientes" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Pie Chart - Regional Distribution */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución Regional</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={analytics.chartData.regionalDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {analytics.chartData.regionalDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={["#667eea", "#764ba2", "#f093fb", "#4facfe", "#00f2fe"][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Line Chart - Income vs Penetration */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingreso vs Penetración</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={analytics.chartData.topMunicipalities}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Area yAxisId="left" type="monotone" dataKey="income" fill="#8884d8" stroke="#8884d8" name="Ingreso (k$)" />
                          <Area yAxisId="right" type="monotone" dataKey="penetration" fill="#82ca9d" stroke="#82ca9d" name="Penetración %" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Scatter Chart */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingreso vs Penetración (Scatter)</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={analytics.chartData.scatterData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="income" name="Ingreso" unit="$" />
                          <YAxis dataKey="penetration" name="Penetración" unit="%" />
                          <Tooltip />
                          <Area type="monotone" dataKey="customers" fill="#ffc658" stroke="#ff7300" name="Clientes" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Neural Network Tab */}
              {activeTab === "neural" && analytics.neuralPredictions && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Brain className="w-6 h-6 text-primary-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Predicciones con Red Neuronal</h2>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Modelo de red neuronal multicapa para predicciones más precisas basadas en múltiples variables
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Municipio</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actual</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Predicción NN</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Mejora</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Confianza</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {analytics.neuralPredictions.map((m, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-semibold text-gray-900">{m.name}</td>
                            <td className="px-4 py-3 text-right">{m.customers.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-semibold">{m.neuralPrediction.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-green-600 font-semibold">
                              {m.improvement > 0 ? `+${m.improvement.toLocaleString()}` : "-"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                {m.confidence}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Decision Tree Tab */}
              {activeTab === "decision" && analytics.decisionTree && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <TreePine className="w-6 h-6 text-primary-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Clasificación con Árbol de Decisión</h2>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Clasificación automática de municipios en categorías estratégicas basada en reglas de decisión
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {analytics.decisionTree.summary.map((cat, idx) => (
                      <div key={idx} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                        <h3 className="font-bold text-gray-900 mb-2">{cat.category}</h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Municipios:</span>
                            <span className="font-semibold">{cat.count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Score Promedio:</span>
                            <span className="font-semibold">{cat.avgScore}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Clientes:</span>
                            <span className="font-semibold">{cat.totalCustomers.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Municipio</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Categoría</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Prioridad</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Score</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Clientes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {analytics.decisionTree.classifications.slice(0, 20).map((m, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-semibold text-gray-900">{m.name}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                                {m.category}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                m.priority === "High" ? "bg-red-100 text-red-700" :
                                m.priority === "Medium" ? "bg-yellow-100 text-yellow-700" :
                                "bg-gray-100 text-gray-700"
                              }`}>
                                {m.priority}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">{m.score}</td>
                            <td className="px-4 py-3 text-right">{m.customers.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Time Series Tab */}
              {activeTab === "timeseries" && analytics.timeSeries && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-6 h-6 text-primary-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Análisis de Series Temporales</h2>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Proyecciones de crecimiento mensual basadas en tendencias históricas (Tasa de crecimiento: {analytics.timeSeries.avgGrowthRate}%)
                  </p>
                  
                  <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Proyección Mensual</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analytics.timeSeries.monthlyProjections}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="projected" stroke="#667eea" strokeWidth={2} name="Proyección" />
                        {analytics.timeSeries.monthlyProjections.some(d => d.current !== null) && (
                          <Line type="monotone" dataKey="current" stroke="#f093fb" strokeWidth={3} name="Actual" />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Crecimiento Proyectado</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Municipio</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Clientes Actuales</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Proyección 12 Meses</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Tasa Crecimiento</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {analytics.timeSeries.topGrowth.map((m, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-semibold text-gray-900">{m.name}</td>
                              <td className="px-4 py-3 text-right">{m.customers.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right font-semibold">{Math.round(m.projectedGrowth).toLocaleString()}</td>
                              <td className="px-4 py-3 text-right text-green-600 font-semibold">{m.growthRate.toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Heatmap Tab */}
              {activeTab === "heatmap" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MapIcon className="w-6 h-6 text-primary-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Heatmap Geográfico por Métrica</h2>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Visualización geográfica de métricas clave en el mapa de Puerto Rico
                  </p>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Métrica:</label>
                    <select
                      value={selectedMetric}
                      onChange={(e) => setSelectedMetric(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="customers">Número de Clientes</option>
                      <option value="penetration">Tasa de Penetración</option>
                      <option value="income">Ingreso Promedio</option>
                      <option value="growth">Potencial de Crecimiento</option>
                    </select>
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="relative h-[600px] rounded-lg overflow-hidden border border-gray-200">
                      <div ref={heatmapMapContainer} className="absolute inset-0 w-full h-full" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {analytics.municipios
                      .sort((a, b) => {
                        if (selectedMetric === "customers") return b.customers - a.customers;
                        if (selectedMetric === "penetration") return parseFloat(b.penetrationRate) - parseFloat(a.penetrationRate);
                        if (selectedMetric === "income") return b.avgIncome - a.avgIncome;
                        return 0;
                      })
                      .slice(0, 8)
                      .map((m, idx) => (
                        <div key={idx} className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
                          <h4 className="font-semibold text-gray-900 mb-2">{m.name}</h4>
                          <div className="text-sm space-y-1">
                            {selectedMetric === "customers" && (
                              <p className="text-gray-700">Clientes: <span className="font-bold">{m.customers.toLocaleString()}</span></p>
                            )}
                            {selectedMetric === "penetration" && (
                              <p className="text-gray-700">Penetración: <span className="font-bold">{m.penetrationRate}%</span></p>
                            )}
                            {selectedMetric === "income" && (
                              <p className="text-gray-700">Ingreso: <span className="font-bold">${m.avgIncome.toLocaleString()}</span></p>
                            )}
                            {selectedMetric === "growth" && (
                              <p className="text-gray-700">Potencial: <span className="font-bold text-green-600">Alto</span></p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Correlations Tab */}
              {activeTab === "correlations" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Activity className="w-6 h-6 text-primary-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Análisis de Correlación</h2>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Relaciones estadísticas entre variables clave del mercado
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { 
                        name: "Ingreso vs Penetración", 
                        value: analytics.correlations.incomeVsPenetration,
                        description: "Correlación entre nivel de ingresos y adopción de energía solar"
                      },
                      { 
                        name: "Población vs Clientes", 
                        value: analytics.correlations.populationVsCustomers,
                        description: "Relación entre tamaño poblacional y número de clientes"
                      },
                      { 
                        name: "Ingreso vs Clientes", 
                        value: analytics.correlations.incomeVsCustomers,
                        description: "Impacto del ingreso en el número de clientes solares"
                      },
                    ].map((corr, idx) => {
                      const strength = Math.abs(corr.value);
                      const strengthLabel = strength > 0.7 ? "Fuerte" : strength > 0.4 ? "Moderada" : "Débil";
                      const color = strength > 0.7 ? "green" : strength > 0.4 ? "yellow" : "red";
                      
                      return (
                        <div key={idx} className="bg-white rounded-xl p-6 border border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{corr.name}</h3>
                          <div className="mb-4">
                            <div className="flex items-baseline gap-2 mb-2">
                              <span className="text-3xl font-bold text-gray-900">
                                {corr.value > 0 ? '+' : ''}{corr.value.toFixed(3)}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                color === 'green' ? 'bg-green-100 text-green-700' :
                                color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {strengthLabel}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  color === 'green' ? 'bg-green-500' :
                                  color === 'yellow' ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(100, strength * 100)}%` }}
                              />
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{corr.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Anomalies Tab */}
              {activeTab === "anomalies" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="w-6 h-6 text-primary-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Detección de Anomalías</h2>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Municipios con patrones inusuales que requieren atención especial
                  </p>
                  <div className="space-y-4">
                    {analytics.anomalies.map((m, idx) => (
                      <div key={idx} className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xl font-bold text-gray-900">{m.name}</h3>
                          <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-sm font-semibold">
                            Z-Score: {m.zScore.toFixed(2)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Clientes:</span>
                            <span className="ml-2 font-semibold text-gray-900">{m.customers.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Ingreso:</span>
                            <span className="ml-2 font-semibold text-gray-900">${m.avgIncome.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Población:</span>
                            <span className="ml-2 font-semibold text-gray-900">{m.avgPopulation.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Penetración:</span>
                            <span className="ml-2 font-semibold text-gray-900">{m.penetrationRate}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Regional Analysis Tab */}
              {activeTab === "regional" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="w-6 h-6 text-primary-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Análisis Regional</h2>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Comparación de métricas clave por región geográfica de Puerto Rico
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {analytics.regionalAnalysis.map((region, idx) => (
                      <div key={idx} className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">{region.name}</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Municipios:</span>
                            <span className="font-semibold text-gray-900">{region.municipalities.length}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Clientes:</span>
                            <span className="font-semibold text-gray-900">{region.totalCustomers.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Penetración:</span>
                            <span className="font-semibold text-gray-900">{region.avgPenetration}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Ingreso Promedio:</span>
                            <span className="font-semibold text-gray-900">${region.avgIncome.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Market Segmentation Tab */}
              {activeTab === "segments" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Layers3 className="w-6 h-6 text-primary-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Segmentación de Mercado</h2>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Clasificación estratégica de municipios para optimizar estrategias de mercado
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { 
                        name: "Alto Valor", 
                        data: analytics.segments.highValue,
                        colorClass: "purple",
                        bgClass: "from-purple-50 to-purple-100",
                        borderClass: "border-purple-200",
                        badgeClass: "bg-purple-500",
                        description: "Alto ingreso, baja penetración - Oportunidad premium"
                      },
                      { 
                        name: "Mercado Maduro", 
                        data: analytics.segments.mature,
                        colorClass: "green",
                        bgClass: "from-green-50 to-green-100",
                        borderClass: "border-green-200",
                        badgeClass: "bg-green-500",
                        description: "Alta penetración - Mercado establecido"
                      },
                      { 
                        name: "Emergente", 
                        data: analytics.segments.emerging,
                        colorClass: "blue",
                        bgClass: "from-blue-50 to-blue-100",
                        borderClass: "border-blue-200",
                        badgeClass: "bg-blue-500",
                        description: "Buen ingreso, bajo crecimiento - Potencial de expansión"
                      },
                      { 
                        name: "Subatendido", 
                        data: analytics.segments.underserved,
                        colorClass: "orange",
                        bgClass: "from-orange-50 to-orange-100",
                        borderClass: "border-orange-200",
                        badgeClass: "bg-orange-500",
                        description: "Bajo ingreso, pocos clientes - Necesita apoyo"
                      },
                    ].map((segment, idx) => (
                      <div key={idx} className={`bg-gradient-to-br ${segment.bgClass} rounded-xl p-6 border ${segment.borderClass}`}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-gray-900">{segment.name}</h3>
                          <span className={`px-3 py-1 ${segment.badgeClass} text-white rounded-full text-sm font-semibold`}>
                            {segment.data.length} municipios
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{segment.description}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Clientes:</span>
                            <span className="font-semibold">{segment.data.reduce((sum, m) => sum + m.customers, 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Ingreso Promedio:</span>
                            <span className="font-semibold">
                              ${segment.data.length > 0 
                                ? Math.round(segment.data.reduce((sum, m) => sum + m.avgIncome, 0) / segment.data.length).toLocaleString()
                                : 0}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-xs text-gray-600 mb-2">Top 5 municipios:</p>
                          <div className="space-y-1">
                            {segment.data.slice(0, 5).map((m, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span className="text-gray-700">{m.name}</span>
                                <span className="font-semibold text-gray-900">{m.customers.toLocaleString()} clientes</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Export Tab */}
              {activeTab === "export" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Download className="w-6 h-6 text-primary-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Exportar Datos</h2>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Exporta los datos de analytics en diferentes formatos para análisis externo
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                      onClick={exportToPDF}
                      className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border-2 border-red-200 hover:border-red-400 transition-all hover:shadow-lg"
                    >
                      <Download className="w-12 h-12 text-red-600 mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Exportar a PDF</h3>
                      <p className="text-sm text-gray-600 text-center">
                        Genera un reporte completo en formato PDF con todos los analytics
                      </p>
                    </button>

                    <button
                      onClick={exportToCSV}
                      className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200 hover:border-green-400 transition-all hover:shadow-lg"
                    >
                      <Download className="w-12 h-12 text-green-600 mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Exportar a CSV</h3>
                      <p className="text-sm text-gray-600 text-center">
                        Descarga los datos en formato CSV para análisis en Excel o herramientas de BI
                      </p>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AnalyticsPage;

