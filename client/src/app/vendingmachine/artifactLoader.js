const loadArtifacts = async (path) => {
  try {
    const response = await fetch(`/artifacts/${path}`);
    if (!response.ok) throw new Error(`Failed to load ${path}`);

    const arrayBuffer = await response.arrayBuffer(); // Load as binary
    const program = new Uint8Array(arrayBuffer); // Convert to Uint8Array

    return { program }; // Return as object
  } catch (error) {
    console.error("Error loading artifacts:", error);
  }
};

const loadProvingKey = async (path) => {
    try {
      const response = await fetch(`/artifacts/${path}`);
      if (!response.ok) throw new Error(`Failed to load ${path}`);
  
      const arrayBuffer = await response.arrayBuffer(); // Load as binary
      const provingKey = new Uint8Array(arrayBuffer); // Convert to Uint8Array
  
      return provingKey;
    } catch (error) {
      console.error("Error loading proving key:", error);
    }
  };
  

export { loadArtifacts, loadProvingKey };
