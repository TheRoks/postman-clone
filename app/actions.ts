'use server'

import { headers } from 'next/headers'

export async function makeRequest(url: string, method: string, headers: Record<string, string>, body: string) {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = body
    }

    const response = await fetch(url, options)
    const data = await response.json()

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers),
      data,
    }
  } catch (error) {
    console.error('Error making request:', error)
    return {
      error: 'An error occurred while making the request',
    }
  }
}

