import React, { useState, useEffect } from "react";
import { MapPin, Zap, BarChart3, Trophy, Loader2, TrendingUp, DollarSign, Target, Lightbulb, Map as MapIcon } from "lucide-react";
// Import geojson - webpack will handle the large file
import geoJsonData from "../data/geojson.geojson";

const MunicipalityAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("[Analytics] Component mounted, starting analysis...");
    const startTime = performance.now();
    
    // Analyze the geojson data
    const analyzeData = () => {
      console.log("[Analytics] analyzeData() called");
      
      try {
        console.log("[Analytics] Step 1: Checking if geoJsonData is available...");
        const dataCheckTime = performance.now();
        
        // Use the imported JSON data
        let dataToAnalyze = geoJsonData;
        
        console.log(`[Analytics] Data check took ${(performance.now() - dataCheckTime).toFixed(2)}ms`);
        console.log("[Analytics] geoJsonData type:", typeof dataToAnalyze);
        console.log("[Analytics] geoJsonData sample:", typeof dataToAnalyze === 'string' ? dataToAnalyze.substring(0, 100) : "not a string");
        
        // If it's a string, check if it's a URL or JSON string
        if (typeof dataToAnalyze === 'string') {
          // Check if it's a URL (starts with / or http)
          if (dataToAnalyze.startsWith('/') || dataToAnalyze.startsWith('http')) {
            console.log("[Analytics] geoJsonData is a URL, fetching data...");
            console.log("[Analytics] URL:", dataToAnalyze);
            const fetchStartTime = performance.now();
            
            fetch(dataToAnalyze)
              .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
              })
              .then(fetchedData => {
                const fetchTime = performance.now() - fetchStartTime;
                console.log(`[Analytics] Data fetch took ${fetchTime.toFixed(2)}ms`);
                console.log("[Analytics] Fetched data type:", typeof fetchedData);
                console.log("[Analytics] Fetched data keys:", fetchedData ? Object.keys(fetchedData).slice(0, 10) : "null");
                
                // Process the fetched data
                analyzeDataWithData(fetchedData);
              })
              .catch(fetchError => {
                console.error("[Analytics] Failed to fetch geojson:", fetchError);
                setError("Error al cargar los datos. Por favor, recarga la página.");
                setLoading(false);
              });
            return; // Exit early, will continue in fetch callback
          } else {
            // It's a JSON string, try to parse it
            console.log("[Analytics] geoJsonData is a JSON string, parsing...");
            const parseStartTime = performance.now();
            try {
              dataToAnalyze = JSON.parse(dataToAnalyze);
              console.log(`[Analytics] JSON parsing took ${(performance.now() - parseStartTime).toFixed(2)}ms`);
              console.log("[Analytics] Parsed data type:", typeof dataToAnalyze);
              console.log("[Analytics] Parsed data keys:", dataToAnalyze ? Object.keys(dataToAnalyze).slice(0, 10) : "null");
            } catch (parseError) {
              console.error("[Analytics] Failed to parse JSON:", parseError);
              setError("Error al parsear los datos JSON. Por favor, recarga la página.");
              setLoading(false);
              return;
            }
          }
        }
        
        if (!dataToAnalyze) {
          console.warn("[Analytics] geoJsonData is null or undefined after parsing");
          setLoading(false);
          return;
        }

        console.log("[Analytics] Step 2: Extracting features array...");
        const featuresExtractTime = performance.now();
        
        // Handle both direct features and nested structure
        let features = [];
        if (dataToAnalyze.features && Array.isArray(dataToAnalyze.features)) {
          features = dataToAnalyze.features;
          console.log("[Analytics] Found features in dataToAnalyze.features");
        } else if (dataToAnalyze.type === 'FeatureCollection' && dataToAnalyze.features) {
          features = dataToAnalyze.features;
          console.log("[Analytics] Found features in FeatureCollection");
        } else if (Array.isArray(dataToAnalyze)) {
          features = dataToAnalyze;
          console.log("[Analytics] dataToAnalyze is directly an array");
        } else {
          console.warn("[Analytics] Unknown data structure:", {
            type: typeof dataToAnalyze,
            hasFeatures: !!dataToAnalyze.features,
            isArray: Array.isArray(dataToAnalyze),
            keys: Object.keys(dataToAnalyze || {}).slice(0, 10)
          });
        }
        
        console.log(`[Analytics] Features extraction took ${(performance.now() - featuresExtractTime).toFixed(2)}ms`);
        console.log("[Analytics] Total features found:", features.length);
        
        if (!features || features.length === 0) {
          console.warn("[Analytics] No features found in data");
          console.log("[Analytics] Attempting to fetch geojson from public folder...");
          
          // Try fetching from public folder as fallback
          fetch('/data/geojson.json')
            .then(response => {
              if (!response.ok) throw new Error('Failed to fetch');
              return response.json();
            })
            .then(fetchedData => {
              console.log("[Analytics] Successfully fetched geojson from public folder");
              const fetchedFeatures = fetchedData.features || (fetchedData.type === 'FeatureCollection' ? fetchedData.features : []);
              if (fetchedFeatures && fetchedFeatures.length > 0) {
                console.log("[Analytics] Using fetched data with", fetchedFeatures.length, "features");
                // Re-run analysis with fetched data
                analyzeDataWithData(fetchedData);
              } else {
                setError("No se encontraron datos válidos en el archivo geojson.");
                setLoading(false);
              }
            })
            .catch(fetchError => {
              console.error("[Analytics] Failed to fetch geojson:", fetchError);
              setError("No se pudieron cargar los datos. Por favor, recarga la página.");
              setLoading(false);
            });
          return;
        }
        
        // Continue with analysis if features found
        processFeatures(features);
      } catch (err) {
        const errorTime = performance.now() - startTime;
        console.error(`[Analytics] ❌ Error after ${errorTime.toFixed(2)}ms:`, err);
        console.error("[Analytics] Error stack:", err.stack);
        setError("Error al cargar los datos. Por favor, recarga la página.");
        setLoading(false);
      }
    };
    
    // Separate function to process features
    const processFeatures = (features) => {
      console.log("[Analytics] Step 3: Processing features and counting municipalities...");
      const processingStartTime = performance.now();
      
      const municipioCounts = {};
      const municipioData = {};
      const coordinates = []; // For geographic analysis
      let processedCount = 0;
      const logInterval = Math.max(1, Math.floor(features.length / 10)); // Log every 10%

      features.forEach((feature, index) => {
        // Extract municipality name from County (e.g., "Añasco Municipio" -> "Añasco")
        // or use City as fallback
        let municipio = "Unknown";
        if (feature.properties?.County) {
          municipio = feature.properties.County.replace(" Municipio", "").trim();
        } else if (feature.properties?.City) {
          municipio = feature.properties.City;
        } else if (feature.properties?.Municipio) {
          municipio = feature.properties.Municipio;
        }
        
        const dbh = feature.properties?.dbh || 0;
        const income = feature.properties?.Income || feature.properties?.IncomePerCap || 0;
        const population = feature.properties?.TotalPop || feature.properties?.Population || 0;
        
        // Store coordinates for geographic analysis
        if (feature.geometry?.coordinates) {
          const [lng, lat] = feature.geometry.coordinates;
          coordinates.push({ lng, lat, municipio });
        }

        if (!municipioCounts[municipio]) {
          municipioCounts[municipio] = 0;
          municipioData[municipio] = {
            count: 0,
            totalDbh: 0,
            totalIncome: 0,
            incomeCount: 0,
            totalPopulation: 0,
            populationCount: 0,
            coordinates: [],
          };
        }

        municipioCounts[municipio]++;
        municipioData[municipio].count++;
        if (dbh > 0) {
          municipioData[municipio].totalDbh += dbh;
        }
        if (income > 0) {
          municipioData[municipio].totalIncome += income;
          municipioData[municipio].incomeCount++;
        }
        if (population > 0) {
          municipioData[municipio].totalPopulation += population;
          municipioData[municipio].populationCount++;
        }
        if (feature.geometry?.coordinates) {
          const [lng, lat] = feature.geometry.coordinates;
          municipioData[municipio].coordinates.push({ lng, lat });
        }
        
        processedCount++;
        if (index > 0 && index % logInterval === 0) {
          const progress = ((index / features.length) * 100).toFixed(1);
          console.log(`[Analytics] Processing progress: ${progress}% (${index}/${features.length} features)`);
        }
      });
      
      const processingTime = performance.now() - processingStartTime;
      console.log(`[Analytics] Feature processing took ${processingTime.toFixed(2)}ms`);
      console.log(`[Analytics] Processed ${processedCount} features`);
      console.log(`[Analytics] Found ${Object.keys(municipioCounts).length} unique municipalities`);

      console.log("[Analytics] Step 4: Sorting and calculating top municipalities...");
      const sortingStartTime = performance.now();

      // Get top municipalities by count
      const sortedMunicipios = Object.entries(municipioCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      const sortingTime = performance.now() - sortingStartTime;
      console.log(`[Analytics] Sorting took ${sortingTime.toFixed(2)}ms`);

      console.log("[Analytics] Step 5: Calculating averages and statistics...");
      const calcStartTime = performance.now();

      // Calculate averages and insights
      const topMunicipios = sortedMunicipios.map(([name, count]) => {
        const data = municipioData[name];
        const avgDbh = data.totalDbh > 0 ? (data.totalDbh / data.count).toFixed(1) : 0;
        const avgIncome = data.incomeCount > 0 ? Math.round(data.totalIncome / data.incomeCount) : 0;
        const avgPopulation = data.populationCount > 0 ? Math.round(data.totalPopulation / data.populationCount) : 0;
        const penetrationRate = avgPopulation > 0 ? ((count / avgPopulation) * 100).toFixed(2) : 0;

        return {
          name,
          count,
          avgDbh: parseFloat(avgDbh),
          avgIncome,
          avgPopulation,
          penetrationRate: parseFloat(penetrationRate),
        };
      });

      // Calculate total statistics
      const totalMunicipios = Object.keys(municipioCounts).length;
      const totalCustomers = Object.values(municipioCounts).reduce((sum, count) => sum + count, 0);
      const avgCustomersPerMunicipio = Math.round(totalCustomers / totalMunicipios);

      // Find municipality with most customers
      const topMunicipio = sortedMunicipios[0];
      
      // Calculate insights
      console.log("[Analytics] Step 5.5: Calculating insights...");
      const insightsStartTime = performance.now();
      
      // 1. Market Penetration Analysis
      const penetrationData = Object.entries(municipioData)
        .map(([name, data]) => {
          const customers = municipioCounts[name];
          const avgPop = data.populationCount > 0 ? data.totalPopulation / data.populationCount : 0;
          return {
            name,
            customers,
            population: avgPop,
            penetrationRate: avgPop > 0 ? (customers / avgPop) * 100 : 0,
          };
        })
        .filter(d => d.population > 0)
        .sort((a, b) => b.penetrationRate - a.penetrationRate);
      
      const highestPenetration = penetrationData[0];
      const lowestPenetration = penetrationData[penetrationData.length - 1];
      
      // 2. Income Correlation
      const incomeData = Object.entries(municipioData)
        .map(([name, data]) => {
          const customers = municipioCounts[name];
          const avgIncome = data.incomeCount > 0 ? data.totalIncome / data.incomeCount : 0;
          return {
            name,
            customers,
            avgIncome,
            incomePerCustomer: customers > 0 ? avgIncome / customers : 0,
          };
        })
        .filter(d => d.avgIncome > 0)
        .sort((a, b) => b.avgIncome - a.avgIncome);
      
      const highestIncome = incomeData[0];
      const lowestIncome = incomeData[incomeData.length - 1];
      
      // 3. Geographic Distribution (most concentrated vs most spread out)
      const geographicData = Object.entries(municipioData)
        .map(([name, data]) => {
          const customers = municipioCounts[name];
          if (data.coordinates.length < 2) {
            return { name, customers, spread: 0, density: customers };
          }
          
          // Calculate bounding box
          const lngs = data.coordinates.map(c => c.lng);
          const lats = data.coordinates.map(c => c.lat);
          const lngRange = Math.max(...lngs) - Math.min(...lngs);
          const latRange = Math.max(...lats) - Math.min(...lats);
          const spread = Math.sqrt(lngRange * lngRange + latRange * latRange);
          const density = customers / (spread || 1); // customers per unit of spread
          
          return {
            name,
            customers,
            spread,
            density,
          };
        })
        .filter(d => d.customers > 0)
        .sort((a, b) => b.density - a.density);
      
      const mostConcentrated = geographicData[0];
      const mostSpreadOut = geographicData.sort((a, b) => a.density - b.density)[0];
      
      // 4. Growth Potential (low penetration, high income)
      const growthPotential = penetrationData
        .map(d => {
          const incomeInfo = incomeData.find(i => i.name === d.name);
          return {
            name: d.name,
            penetrationRate: d.penetrationRate,
            avgIncome: incomeInfo?.avgIncome || 0,
            growthScore: (100 - d.penetrationRate) * (incomeInfo?.avgIncome || 0) / 10000,
          };
        })
        .filter(d => d.avgIncome > 0)
        .sort((a, b) => b.growthScore - a.growthScore)
        .slice(0, 5);
      
      // 5. Market Concentration (top 3 vs rest)
      const top3Customers = sortedMunicipios.slice(0, 3).reduce((sum, [, count]) => sum + count, 0);
      const marketConcentration = ((top3Customers / totalCustomers) * 100).toFixed(1);
      
      const insightsTime = performance.now() - insightsStartTime;
      console.log(`[Analytics] Insights calculation took ${insightsTime.toFixed(2)}ms`);

      const calcTime = performance.now() - calcStartTime;
      console.log(`[Analytics] Calculations took ${calcTime.toFixed(2)}ms`);
      console.log("[Analytics] Results:", {
        totalMunicipios,
        totalCustomers,
        avgCustomersPerMunicipio,
        topMunicipio: topMunicipio ? topMunicipio[0] : "none"
      });

      console.log("[Analytics] Step 6: Setting state with results...");
      const stateStartTime = performance.now();

      setAnalytics({
        totalMunicipios,
        totalCustomers,
        avgCustomersPerMunicipio,
        topMunicipio: topMunicipio ? { name: topMunicipio[0], count: topMunicipio[1] } : null,
        topMunicipios,
        insights: {
          highestPenetration,
          lowestPenetration,
          highestIncome,
          lowestIncome,
          mostConcentrated,
          mostSpreadOut,
          growthPotential,
          marketConcentration: parseFloat(marketConcentration),
        },
      });
      setLoading(false);
      setError(null);

      const stateTime = performance.now() - stateStartTime;
      const overallTime = performance.now() - startTime;
      
      console.log(`[Analytics] State update took ${stateTime.toFixed(2)}ms`);
      console.log(`[Analytics] ⏱️ Overall time from mount: ${overallTime.toFixed(2)}ms`);
      console.log("[Analytics] ✅ Analysis complete!");
    };
    
    // Wrapper function that accepts data parameter
    const analyzeDataWithData = (dataToUse) => {
      const stepStartTime = performance.now();
      console.log("[Analytics] analyzeDataWithData() called with provided data");
      
      try {
        let dataToAnalyze = dataToUse || geoJsonData;
        
        // If it's a string, parse it as JSON
        if (typeof dataToAnalyze === 'string') {
          console.log("[Analytics] Data is a string, parsing JSON...");
          const parseTime = performance.now();
          dataToAnalyze = JSON.parse(dataToAnalyze);
          console.log(`[Analytics] JSON parsing took ${(performance.now() - parseTime).toFixed(2)}ms`);
        }
        
        if (!dataToAnalyze) {
          setLoading(false);
          return;
        }

        // Extract features
        let features = [];
        if (dataToAnalyze.features && Array.isArray(dataToAnalyze.features)) {
          features = dataToAnalyze.features;
        } else if (dataToAnalyze.type === 'FeatureCollection' && dataToAnalyze.features) {
          features = dataToAnalyze.features;
        } else if (Array.isArray(dataToAnalyze)) {
          features = dataToAnalyze;
        }
        
        console.log(`[Analytics] Found ${features.length} features in provided data`);
        
        if (!features || features.length === 0) {
          setError("No se encontraron datos válidos.");
          setLoading(false);
          return;
        }
        
        processFeatures(features);
        
        const totalTime = performance.now() - stepStartTime;
        console.log(`[Analytics] analyzeDataWithData() total execution: ${totalTime.toFixed(2)}ms`);
      } catch (err) {
        console.error("[Analytics] Error in analyzeDataWithData:", err);
        setError("Error al procesar los datos.");
        setLoading(false);
      }
    };

    let analysisCompleted = false;
    
    // Wrap analyzeData to track completion
    const wrappedAnalyzeData = () => {
      if (analysisCompleted) {
        console.log("[Analytics] Analysis already completed, skipping...");
        return;
      }
      analyzeData();
      analysisCompleted = true;
    };

    // Use requestAnimationFrame to ensure DOM is ready
    console.log("[Analytics] Scheduling analysis with requestAnimationFrame...");
    const rafId = requestAnimationFrame(() => {
      console.log("[Analytics] requestAnimationFrame callback executed");
      wrappedAnalyzeData();
    });
    
    // Also try after a delay in case data is still loading
    console.log("[Analytics] Setting fallback timeout (1000ms)...");
    const timer = setTimeout(() => {
      console.log("[Analytics] Fallback timeout triggered");
      if (!analysisCompleted) {
        console.log("[Analytics] Analysis not completed yet, retrying...");
        wrappedAnalyzeData();
      } else {
        console.log("[Analytics] Analysis already completed, skipping retry");
      }
    }, 1000);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-red-600 font-medium mb-2">Error al cargar datos</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Analizando datos...</p>
          <p className="text-gray-400 text-xs mt-2">Esto puede tomar unos momentos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Análisis por Municipios
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Descubra insights interesantes sobre la distribución de energía solar en Puerto Rico
        </p>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{analytics.totalMunicipios}</span>
          </div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Municipios con Clientes Solares</h3>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{analytics.totalCustomers.toLocaleString()}</span>
          </div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Total de Clientes Solares</h3>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{analytics.avgCustomersPerMunicipio}</span>
          </div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Promedio por Municipio</h3>
        </div>
      </div>

      {/* Top Municipalities */}
      {analytics.topMunicipio && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 mb-12 text-white shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-primary-100 text-sm font-semibold uppercase tracking-wider mb-2">
                Municipio con Más Clientes Solares
              </p>
              <h3 className="text-3xl md:text-4xl font-bold mb-2">{analytics.topMunicipio.name}</h3>
              <p className="text-primary-100 text-lg">
                {analytics.topMunicipio.count.toLocaleString()} clientes solares
              </p>
            </div>
            <div className="text-6xl md:text-7xl font-bold text-white/20">
              <Trophy className="w-16 h-16 md:w-20 md:h-20 text-white/20" />
            </div>
          </div>
        </div>
      )}

      {/* Top 10 Municipalities Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Top 10 Municipios por Clientes Solares</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Municipio</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Clientes</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">% del Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analytics.topMunicipios.map((municipio, index) => {
                const percentage = ((municipio.count / analytics.totalCustomers) * 100).toFixed(1);
                return (
                  <tr key={municipio.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{municipio.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-gray-900">{municipio.count.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                          <div
                            className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-600 w-12 text-right">{percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights Section */}
      {analytics.insights && (
        <div className="mt-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <Lightbulb className="w-8 h-8 text-primary-600" />
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Insights y Análisis
              </h2>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Descubra patrones interesantes y oportunidades en el mercado de energía solar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Market Penetration */}
            {analytics.insights.highestPenetration && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Mayor Penetración de Mercado</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-green-700">{analytics.insights.highestPenetration.name}</p>
                  <p className="text-gray-600">
                    <span className="font-semibold">{analytics.insights.highestPenetration.penetrationRate.toFixed(2)}%</span> de la población tiene energía solar
                  </p>
                  <p className="text-sm text-gray-500">
                    {analytics.insights.highestPenetration.customers.toLocaleString()} clientes de {analytics.insights.highestPenetration.population.toLocaleString()} habitantes
                  </p>
                </div>
              </div>
            )}

            {/* Income Correlation */}
            {analytics.insights.highestIncome && (
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Mayor Ingreso Promedio</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-blue-700">{analytics.insights.highestIncome.name}</p>
                  <p className="text-gray-600">
                    Ingreso promedio: <span className="font-semibold">${analytics.insights.highestIncome.avgIncome.toLocaleString()}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    {analytics.insights.highestIncome.customers.toLocaleString()} clientes solares
                  </p>
                </div>
              </div>
            )}

            {/* Geographic Concentration */}
            {analytics.insights.mostConcentrated && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <MapIcon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Más Concentrado</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-purple-700">{analytics.insights.mostConcentrated.name}</p>
                  <p className="text-gray-600">
                    Mayor densidad de clientes solares por área
                  </p>
                  <p className="text-sm text-gray-500">
                    {analytics.insights.mostConcentrated.customers.toLocaleString()} clientes en un área compacta
                  </p>
                </div>
              </div>
            )}

            {/* Market Concentration */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Concentración de Mercado</h3>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-orange-700">{analytics.insights.marketConcentration}%</p>
                <p className="text-gray-600">
                  Los 3 municipios principales concentran el <span className="font-semibold">{analytics.insights.marketConcentration}%</span> del mercado
                </p>
                <p className="text-sm text-gray-500">
                  Indica un mercado {analytics.insights.marketConcentration > 50 ? 'altamente concentrado' : 'relativamente distribuido'}
                </p>
              </div>
            </div>
          </div>

          {/* Growth Potential */}
          {analytics.insights.growthPotential && analytics.insights.growthPotential.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mt-8">
              <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-primary-100 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-primary-600" />
                  <h3 className="text-xl font-bold text-gray-900">Oportunidades de Crecimiento</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Municipios con alto potencial: baja penetración actual pero alto ingreso promedio
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.insights.growthPotential.map((municipio, index) => (
                    <div key={municipio.name} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-bold text-gray-900">{municipio.name}</span>
                        <span className="text-xs font-semibold text-primary-600 bg-primary-100 px-2 py-1 rounded-full">
                          #{index + 1}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600">
                          Penetración: <span className="font-semibold text-gray-900">{municipio.penetrationRate.toFixed(2)}%</span>
                        </p>
                        <p className="text-gray-600">
                          Ingreso: <span className="font-semibold text-gray-900">${municipio.avgIncome.toLocaleString()}</span>
                        </p>
                        <div className="mt-2 pt-2 border-t border-gray-300">
                          <p className="text-xs text-gray-500">
                            Score de crecimiento: <span className="font-semibold text-primary-600">{municipio.growthScore.toFixed(1)}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {analytics.insights.lowestPenetration && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Menor Penetración</h4>
                <p className="text-xl font-bold text-gray-900 mb-1">{analytics.insights.lowestPenetration.name}</p>
                <p className="text-gray-600 text-sm">
                  Solo <span className="font-semibold">{analytics.insights.lowestPenetration.penetrationRate.toFixed(2)}%</span> de penetración
                </p>
              </div>
            )}
            {analytics.insights.mostSpreadOut && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Distribución Más Amplia</h4>
                <p className="text-xl font-bold text-gray-900 mb-1">{analytics.insights.mostSpreadOut.name}</p>
                <p className="text-gray-600 text-sm">
                  Clientes distribuidos en un área más extensa
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MunicipalityAnalytics;

