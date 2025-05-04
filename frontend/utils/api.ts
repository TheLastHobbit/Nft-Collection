import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001'; // 后端服务地址

export const uploadNFT = async (formData: FormData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};