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

Contexto:
- Clientes de energía solar: ${stats.customers || 'N/A'}
- Ingreso promedio: $${stats.avgIncome?.toLocaleString() || 'N/A'}
- Tasa de penetración solar: ${stats.penetrationRate || 'N/A'}%
- Población promedio: ${stats.avgPopulation?.toLocaleString() || 'N/A'}

La descripción debe:
- Ser entre 150-250 palabras
- Destacar aspectos únicos del municipio
- Mencionar el potencial de energía solar
- Ser informativa pero atractiva
- Incluir información sobre la adopción de energía solar si es relevante

Escribe solo la descripción, sin títulos ni encabezados.`;

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
            content: 'Eres un experto en escribir descripciones atractivas sobre municipios de Puerto Rico, con enfoque en energía solar y desarrollo sostenible.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 300,
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
- highlights: array de 2-3 puntos destacados en una frase cada uno
- funFact: un dato interesante sobre el municipio en una frase

Datos del municipio:
- Clientes solares: ${stats.customers || 'N/A'}
- Ingreso promedio: $${stats.avgIncome?.toLocaleString() || 'N/A'}
- Penetración solar: ${stats.penetrationRate || 'N/A'}%

Responde SOLO con un JSON válido, sin texto adicional.`;

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
            content: 'Eres un experto en generar contenido estructurado sobre municipios de Puerto Rico. Responde siempre con JSON válido.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
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

