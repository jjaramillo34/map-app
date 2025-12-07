/**
 * OpenAI service for generating municipality descriptions
 */

/**
 * Generate a description for a municipality using OpenAI
 * @param {string} municipioName - Name of the municipality
 * @param {Object} stats - Statistics about the municipality (customers, income, etc.)
 * @returns {Promise<string>} - Generated description
 */
export const generateMunicipalityDescription = async (municipioName, stats = {}) => {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please set REACT_APP_OPENAI_API_KEY in your .env file');
  }

  const prompt = `Escribe una descripción atractiva y profesional en español para el municipio de ${municipioName}, Puerto Rico. 

IMPORTANTE: Utiliza datos del Censo de Estados Unidos (US Census Bureau) y Wikipedia como fuentes principales.

Contexto del municipio:
- Clientes de energía solar: ${stats.customers || 'N/A'}
- Ingreso promedio: $${stats.avgIncome?.toLocaleString() || 'N/A'}
- Tasa de penetración solar: ${stats.penetrationRate || 'N/A'}%
- Población promedio: ${stats.avgPopulation?.toLocaleString() || 'N/A'}

La descripción debe:
- Ser 500 palabras
- Incluir datos demográficos detallados del Censo de Estados Unidos, incluyendo:
  * Población total y densidad poblacional
  * Ingresos medianos y per cápita
  * Niveles de educación (porcentaje con educación superior, graduados de secundaria)
  * Datos de vivienda (valor mediano de viviendas, porcentaje de propietarios vs. inquilinos)
  * Datos de empleo (tasa de empleo, sectores económicos principales)
  * Composición étnica y demográfica
  * Edad promedio y distribución por grupos de edad
- ESPECIFICAR EL AÑO DEL CENSO utilizado (ej: "según el Censo de 2020" o "datos del Censo 2010-2020")
- Mencionar información histórica y cultural de Wikipedia
- Destacar aspectos únicos del municipio
- Mencionar el potencial de energía solar
- Ser informativa pero atractiva
- Incluir información sobre la adopción de energía solar si es relevante
- Al final de la descripción, incluir una sección de "Fuentes:" con referencias a:
  * "Censo de Estados Unidos [AÑO]" (US Census Bureau [YEAR])
  * "Wikipedia - [nombre del municipio]"

Escribe la descripción completa incluyendo la sección de fuentes al final con el año específico del censo.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en escribir descripciones atractivas sobre municipios de Puerto Rico, con enfoque en energía solar y desarrollo sostenible. Siempre utiliza datos del Censo de Estados Unidos (US Census Bureau) para información demográfica y estadística, especificando el año del censo utilizado (2020, 2010, etc.). Incluye datos detallados sobre población, ingresos, educación, vivienda, empleo y demografía. Utiliza Wikipedia para información histórica y cultural. Incluye siempre referencias a las fuentes utilizadas con el año específico del censo.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 700,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('Error generating description:', error);
    throw error;
  }
};

/**
 * Generate additional content (tags, highlights, etc.)
 * @param {string} municipioName - Name of the municipality
 * @param {Object} stats - Statistics
 * @returns {Promise<Object>} - Generated content object
 */
export const generateAdditionalContent = async (municipioName, stats = {}) => {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `Para el municipio de ${municipioName}, Puerto Rico, genera un JSON con:
- tags: array de 3-5 palabras clave relevantes (ej: ["Turismo", "Energía Solar", "Cultura"])
- highlights: array de 2-3 puntos destacados en una frase cada uno (basados en datos detallados del Censo o Wikipedia)
- funFact: un dato interesante sobre el municipio en una frase (preferiblemente de Wikipedia o datos históricos)
- sources: array de fuentes utilizadas con años específicos (ej: ["US Census Bureau 2020", "Wikipedia - ${municipioName}"])
- censusYear: año del censo utilizado (ej: "2020" o "2010-2020")

IMPORTANTE: 
- Utiliza información detallada del Censo de Estados Unidos (US Census Bureau) para datos demográficos y estadísticos, incluyendo:
  * Población y densidad
  * Ingresos (mediano, per cápita)
  * Educación (niveles de escolaridad)
  * Vivienda (valor mediano, propiedad vs. alquiler)
  * Empleo (tasa, sectores principales)
  * Demografía (edad, etnicidad)
- ESPECIFICA EL AÑO DEL CENSO utilizado (2020, 2010, etc.)
- Utiliza Wikipedia para información histórica, cultural y datos curiosos
- Incluye siempre al menos "US Census Bureau [AÑO]" y "Wikipedia - ${municipioName}" en las fuentes
- El campo censusYear debe contener el año específico del censo (ej: "2020")

Datos del municipio disponibles:
- Clientes solares: ${stats.customers || 'N/A'}
- Ingreso promedio: $${stats.avgIncome?.toLocaleString() || 'N/A'}
- Penetración solar: ${stats.penetrationRate || 'N/A'}%
- Población promedio: ${stats.avgPopulation?.toLocaleString() || 'N/A'}

Responde SOLO con un JSON válido en este formato:
{
  "tags": ["tag1", "tag2", "tag3"],
  "highlights": ["highlight1 con datos específicos del censo", "highlight2"],
  "funFact": "dato curioso",
  "sources": ["US Census Bureau 2020", "Wikipedia - ${municipioName}"],
  "censusYear": "2020"
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en generar contenido estructurado sobre municipios de Puerto Rico. Siempre utiliza datos detallados del Censo de Estados Unidos (US Census Bureau) para información demográfica, especificando el año del censo utilizado. Incluye datos sobre población, ingresos, educación, vivienda, empleo y demografía. Utiliza Wikipedia para información histórica y cultural. Responde siempre con JSON válido incluyendo las fuentes utilizadas con años específicos y el campo censusYear.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim() || '{}';
    
    // Try to parse JSON (handle markdown code blocks if present)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return JSON.parse(content);
  } catch (error) {
    console.error('Error generating additional content:', error);
    throw error;
  }
};

