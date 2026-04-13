// === src/utils/ApiService.ts ===
// base url
const BASE_URL = "http://localhost:42061/api/v1";
// const BASE_URL = "http://10.30.0.247:42061/api/v1";

// Utility function to handle timeout
const fetchWithTimeout = (url: string, options: RequestInit, timeout = 15000) => {
    return Promise.race([
        fetch(url, options),
        new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out')), timeout)
        ),
    ]);
};

export async function apiRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: any
): Promise<T> {
    // Simple log for request
    console.log(`[ApiService] ${method} ${endpoint}`, body ? { body } : '');

    const headers = { "Content-Type": "application/json" };

    const requestOptions: RequestInit = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
    };

    console.log('API Request:', {
        url: `${BASE_URL}${endpoint}`,
        method,
        headers,
        body: body || 'No body',
    });

    try {
        const response = await fetchWithTimeout(`${BASE_URL}${endpoint}`, requestOptions);

        if (!response.ok) {
            const errorBody = await response.json();
            const errorMessage = errorBody.message || `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
        }

        const responseData = await response.json();

        console.log('API Response:', {
            url: `${BASE_URL}${endpoint}`,
            status: response.status,
            statusText: response.statusText,
            data: responseData,
        });

        return responseData as T;
    } catch (error) {
        console.error("API Request Error:", {
            message: error instanceof Error ? error.message : error,
            method,
            endpoint,
            status: error instanceof Error ? error.message : "Unknown",
        });
        throw error;
    }
}

export async function apiFileUpload<T>(
    endpoint: string,
    formData: FormData
): Promise<T> {
    // Simple log for file upload request
    console.log(`[ApiService] POST ${endpoint} (file upload)`, { formDataKeys: Array.from(formData.keys()) });

    const requestOptions: RequestInit = {
        method: 'POST',
        body: formData,
        credentials: 'include',
    };

    console.log('API File Upload Request:', {
        url: `${BASE_URL}${endpoint}`,
        method: 'POST',
        formDataKeys: Array.from(formData.keys()),
    });

    try {
        const response = await fetchWithTimeout(`${BASE_URL}${endpoint}`, requestOptions);

        if (!response.ok) {
            const errorBody = await response.json();
            const errorMessage = errorBody.message || `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
        }

        const responseData = await response.json();

        console.log('API File Upload Response:', {
            url: `${BASE_URL}${endpoint}`,
            status: response.status,
            statusText: response.statusText,
            data: responseData,
        });

        return responseData as T;
    } catch (error) {
        console.error("API File Upload Error:", {
            message: error instanceof Error ? error.message : error,
            endpoint,
            status: error instanceof Error ? error.message : "Unknown",
        });
        throw error;
    }
}
