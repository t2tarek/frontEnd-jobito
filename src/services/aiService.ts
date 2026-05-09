import { API_BASE_URL, getCommonHeaders } from "./api";

export const askGemini = async (message: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/Chat/ask`, {
      method: "POST",
      headers: {
        ...getCommonHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch response from AI");
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("AI Service Error:", error);
    return "عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي.";
  }
};
