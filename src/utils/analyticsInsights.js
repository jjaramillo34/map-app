import { normalizePoiList } from "./municipalityProfile";

const toNumber = (value) => {
  const parsed = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalize = (value, min, max) => {
  if (!Number.isFinite(value) || max <= min) return 0.5;
  return (value - min) / (max - min);
};

const mean = (values) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const standardDeviation = (values) => {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance =
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

export const municipioPath = (name) => `/municipio/${encodeURIComponent(name)}`;

export const pearsonCorrelation = (x, y) => {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  return denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
};

/**
 * Score 0-100: higher income, larger population, and lower solar penetration.
 */
export const computeGapScores = (municipios = []) => {
  if (!municipios.length) return [];

  const incomes = municipios.map((item) => item.avgIncome || 0);
  const populations = municipios.map((item) => item.avgPopulation || 0);
  const penetrations = municipios.map((item) => toNumber(item.penetrationRate));
  const minIncome = Math.min(...incomes);
  const maxIncome = Math.max(...incomes);
  const minPopulation = Math.min(...populations);
  const maxPopulation = Math.max(...populations);
  const minPenetration = Math.min(...penetrations);
  const maxPenetration = Math.max(...penetrations);

  return municipios.map((item) => {
    const incomeScore = normalize(item.avgIncome || 0, minIncome, maxIncome);
    const populationScore = normalize(
      item.avgPopulation || 0,
      minPopulation,
      maxPopulation
    );
    const lowSolarScore =
      1 - normalize(toNumber(item.penetrationRate), minPenetration, maxPenetration);

    return {
      ...item,
      gapScore: Math.round(
        (0.4 * incomeScore + 0.3 * populationScore + 0.3 * lowSolarScore) * 100
      ),
    };
  });
};

export const mergeMunicipalityProfiles = (municipios = [], profilesByName = {}) => {
  const profiles = Array.isArray(profilesByName)
    ? Object.fromEntries(
        profilesByName.filter((item) => item?.name).map((item) => [item.name, item])
      )
    : profilesByName && typeof profilesByName === "object"
      ? profilesByName
      : {};
  const entries = Object.entries(profiles);

  const findProfile = (name) => {
    if (profiles[name]) return profiles[name];
    const match = entries.find(
      ([key]) => key.localeCompare(name, "es", { sensitivity: "base" }) === 0
    );
    return match ? match[1] : null;
  };

  return municipios.map((item) => {
    const profile = findProfile(item.name);
    const pointsOfInterest = normalizePoiList(profile?.pointsOfInterest);

    return {
      ...item,
      solarOpportunity: profile?.solarOpportunity || "",
      pointsOfInterest,
      funFact: profile?.funFact || "",
      salesNotes: profile?.salesNotes || "",
      hasProfile: Boolean(
        profile?.description ||
          profile?.solarOpportunity ||
          pointsOfInterest.length
      ),
    };
  });
};

export const calculateSocioeconomicCorrelations = (municipios = []) => {
  const pairs = (xKey, yKey = "penetrationRate") => {
    const xs = [];
    const ys = [];
    municipios.forEach((item) => {
      const x = toNumber(item[xKey]);
      const y = toNumber(item[yKey]);
      if (x > 0 && y >= 0) {
        xs.push(x);
        ys.push(y);
      }
    });
    return pearsonCorrelation(xs, ys);
  };

  return {
    incomeVsPenetration: pairs("avgIncome"),
    povertyVsPenetration: pairs("avgPoverty"),
    unemploymentVsPenetration: pairs("avgUnemployment"),
    professionalVsPenetration: pairs("avgProfessional"),
    hispanicVsPenetration: pairs("avgHispanic"),
  };
};

export const buildSocioeconomicCharts = (municipios = []) => {
  const scatter = (xKey) =>
    municipios
      .map((item) => ({
        name: item.name,
        x: toNumber(item[xKey]),
        y: toNumber(item.penetrationRate),
        customers: item.customers,
      }))
      .filter((item) => item.x > 0);

  return {
    poverty: scatter("avgPoverty"),
    unemployment: scatter("avgUnemployment"),
    professional: scatter("avgProfessional"),
    hispanic: scatter("avgHispanic"),
  };
};

export const buildExecutiveInsights = (municipios = [], socioCorrelations = {}) => {
  const byGap = [...municipios].sort((a, b) => (b.gapScore || 0) - (a.gapScore || 0));
  const byPenetration = [...municipios].sort(
    (a, b) => toNumber(b.penetrationRate) - toNumber(a.penetrationRate)
  );
  const topGaps = byGap.slice(0, 5);
  const topMature = byPenetration.slice(0, 5);
  const takeaways = [];
  const leader = topGaps[0];

  if (leader) {
    takeaways.push({
      title: "Mayor brecha de mercado",
      text: `${leader.name} combina ingreso de $${leader.avgIncome.toLocaleString()} y una base poblacional de ${leader.avgPopulation.toLocaleString()} con solo ${leader.penetrationRate}% de penetración (score ${leader.gapScore}).`,
    });
  }

  const povertyR = socioCorrelations.povertyVsPenetration || 0;
  const incomeR = socioCorrelations.incomeVsPenetration || 0;
  const hispanicValues = municipios.map((item) => toNumber(item.avgHispanic));
  const hispanicSpread = standardDeviation(hispanicValues);

  if (povertyR <= -0.2) {
    takeaways.push({
      title: "La pobreza frena la adopción",
      text: `Hay correlación negativa entre pobreza y penetración solar (r = ${povertyR.toFixed(2)}). En esos municipios el pitch de ahorro y respaldo ante apagones importa más que el mensaje premium.`,
    });
  } else if (incomeR >= 0.25) {
    takeaways.push({
      title: "El ingreso empuja la solar",
      text: `Mayor ingreso se asocia con más adopción (r = ${incomeR.toFixed(2)}). Prioriza municipios de alto ingreso que todavía están por debajo de la mediana de penetración.`,
    });
  } else if (hispanicSpread < 3 && hispanicValues.some((value) => value > 0)) {
    takeaways.push({
      title: "La variable hispana casi no discrimina",
      text: "El porcentaje hispano es similar en casi todos los municipios, así que no explica quién adopta solar. Usa ingreso, pobreza y el score de oportunidad.",
    });
  } else {
    takeaways.push({
      title: "Ningún factor lo explica solo",
      text: "Ingreso, pobreza y desempleo no bastan por sí solos. Combina el score de oportunidad con la historia local del municipio antes de asignar territorio.",
    });
  }

  const highGapWithoutStory = byGap.filter(
    (item) => (item.gapScore || 0) >= 65 && !item.solarOpportunity
  );
  const withStory = municipios.filter(
    (item) => item.solarOpportunity || item.pointsOfInterest?.length
  );

  if (highGapWithoutStory.length > 0) {
    takeaways.push({
      title: "Falta historia local",
      text: `${highGapWithoutStory.length} municipios de alta oportunidad aún no tienen “Oportunidad solar”. Genéralos en el admin para que el equipo tenga el pitch listo.`,
    });
  } else if (withStory.length > 0) {
    takeaways.push({
      title: "Perfiles listos para ventas",
      text: `${withStory.length} municipios ya tienen oportunidad solar o puntos de interés. Úsalos junto al ranking para preparar visitas.`,
    });
  }

  return {
    topGaps,
    topMature,
    takeaways: takeaways.slice(0, 3),
  };
};

export const sortMunicipios = (municipios, { key, dir }) => {
  const factor = dir === "asc" ? 1 : -1;
  return [...municipios].sort((a, b) => {
    if (key === "name") {
      return a.name.localeCompare(b.name, "es") * factor;
    }
    return (toNumber(a[key]) - toNumber(b[key])) * factor;
  });
};

export const municipalityNameFromProperties = (props = {}) => {
  if (props.County) return props.County.replace(" Municipio", "").trim();
  return props.Municipio || props.City || "";
};

export const aggregateMunicipalityStats = (features = []) => {
  const municipioData = {};

  features.forEach((feature) => {
    const props = feature.properties || {};
    const name = municipalityNameFromProperties(props);
    if (!name) return;

    if (!municipioData[name]) {
      municipioData[name] = {
        name,
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
      };
    }

    const bucket = municipioData[name];
    bucket.customers += 1;
    const income = props.Income || props.IncomePerCap || 0;
    const population = props.TotalPop || props.Population || 0;
    const poverty = props.Poverty || 0;
    const unemployment = props.Unemployment || 0;
    const professional = props.Professional || 0;
    const hispanic = props.Hispanic || 0;

    if (income > 0) {
      bucket.totalIncome += income;
      bucket.incomeCount += 1;
    }
    if (population > 0) {
      bucket.totalPopulation += population;
      bucket.populationCount += 1;
    }
    if (poverty > 0) {
      bucket.totalPoverty += poverty;
      bucket.povertyCount += 1;
    }
    if (unemployment > 0) {
      bucket.totalUnemployment += unemployment;
      bucket.unemploymentCount += 1;
    }
    if (professional > 0) {
      bucket.totalProfessional += professional;
      bucket.professionalCount += 1;
    }
    if (hispanic > 0) {
      bucket.totalHispanic += hispanic;
      bucket.hispanicCount += 1;
    }
  });

  return Object.values(municipioData).map((item) => {
    const avgIncome = item.incomeCount > 0 ? item.totalIncome / item.incomeCount : 0;
    const avgPopulation =
      item.populationCount > 0 ? item.totalPopulation / item.populationCount : 0;
    const avgPoverty = item.povertyCount > 0 ? item.totalPoverty / item.povertyCount : 0;
    const avgUnemployment =
      item.unemploymentCount > 0 ? item.totalUnemployment / item.unemploymentCount : 0;
    const avgProfessional =
      item.professionalCount > 0 ? item.totalProfessional / item.professionalCount : 0;
    const avgHispanic = item.hispanicCount > 0 ? item.totalHispanic / item.hispanicCount : 0;
    const penetrationRate = avgPopulation > 0 ? (item.customers / avgPopulation) * 100 : 0;

    return {
      name: item.name,
      customers: item.customers,
      avgIncome: Math.round(avgIncome),
      avgPopulation: Math.round(avgPopulation),
      avgPoverty: avgPoverty.toFixed(1),
      avgUnemployment: avgUnemployment.toFixed(1),
      avgProfessional: avgProfessional.toFixed(1),
      avgHispanic: avgHispanic.toFixed(1),
      penetrationRate: penetrationRate.toFixed(2),
    };
  });
};

const median = (values) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export const BIVARIATE_CLASSES = {
  opportunity: {
    id: "opportunity",
    label: "Alto ingreso, poca solar",
    color: "#ea580c",
  },
  mature: {
    id: "mature",
    label: "Alto ingreso, mucha solar",
    color: "#16a34a",
  },
  underserved: {
    id: "underserved",
    label: "Bajo ingreso, poca solar",
    color: "#64748b",
  },
  resilient: {
    id: "resilient",
    label: "Bajo ingreso, mucha solar",
    color: "#0d9488",
  },
};

export const assignBivariateClasses = (municipios = []) => {
  const incomes = municipios.map((item) => item.avgIncome || 0);
  const penetrations = municipios.map((item) => toNumber(item.penetrationRate));
  const incomeMedian = median(incomes);
  const penetrationMedian = median(penetrations);

  return municipios.map((item) => {
    const highIncome = (item.avgIncome || 0) >= incomeMedian;
    const highSolar = toNumber(item.penetrationRate) >= penetrationMedian;
    let bivariateClass = "underserved";
    if (highIncome && !highSolar) bivariateClass = "opportunity";
    else if (highIncome && highSolar) bivariateClass = "mature";
    else if (!highIncome && highSolar) bivariateClass = "resilient";

    return { ...item, bivariateClass };
  });
};

export const GAP_FILL_EXPRESSION = [
  "interpolate",
  ["linear"],
  ["get", "gapScore"],
  0,
  "#fff7ed",
  25,
  "#fed7aa",
  50,
  "#fb923c",
  75,
  "#ea580c",
  100,
  "#9a3412",
];

export const BIVARIATE_FILL_EXPRESSION = [
  "match",
  ["get", "bivariateClass"],
  "opportunity",
  BIVARIATE_CLASSES.opportunity.color,
  "mature",
  BIVARIATE_CLASSES.mature.color,
  "underserved",
  BIVARIATE_CLASSES.underserved.color,
  "resilient",
  BIVARIATE_CLASSES.resilient.color,
  "#e5e7eb",
];

