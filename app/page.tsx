'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { makeRequest } from './actions'
import { Sidebar } from '@/components/Sidebar'

interface Request {
  name: string
  url: string
  method: string
  headers: { key: string; value: string }[]
  body: string
}

interface Collection {
  name: string
  requests: Request[]
}

export default function PostmanClone() {
  const [url, setUrl] = useState('')
  const [method, setMethod] = useState('GET')
  const [headers, setHeaders] = useState([{ key: '', value: '' }])
  const [body, setBody] = useState('')
  const [response, setResponse] = useState(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [currentRequest, setCurrentRequest] = useState<Request | null>(null)
  const [requestName, setRequestName] = useState('')

  const handleAddHeader = () => {
    setHeaders([...headers, { key: '', value: '' }])
  }

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers]
    newHeaders[index][field] = value
    setHeaders(newHeaders)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const headersObject = headers.reduce((acc, header) => {
      if (header.key && header.value) {
        acc[header.key] = header.value
      }
      return acc
    }, {} as Record<string, string>)

    const result = await makeRequest(url, method, headersObject, body)
    setResponse(result as any)
  }

  const handleSaveCollection = (collection: Collection) => {
    setCollections([...collections, collection])
  }

  const handleAddRequestToCollection = (collectionName: string) => {
    setCollections(collections.map(collection =>
      collection.name === collectionName
        ? {
          ...collection,
          requests: [...collection.requests, { name: 'New Request', url: '', method: 'GET', headers: [], body: '' }]
        }
        : collection
    ))
  }

  const handleLoadRequest = (request: Request) => {
    setCurrentRequest(request)
    setRequestName(request.name)
    setUrl(request.url)
    setMethod(request.method)
    setHeaders(request.headers.length > 0 ? request.headers : [{ key: '', value: '' }])
    setBody(request.body)
  }

  const handleSaveCurrentRequest = () => {
    if (!requestName) {
      alert('Please enter a name for the request')
      return
    }

    const newRequest: Request = {
      name: requestName,
      url,
      method,
      headers: headers.filter(h => h.key && h.value), // Only save non-empty headers
      body
    }

    if (currentRequest) {
      // Update existing request
      setCollections(collections.map(collection => ({
        ...collection,
        requests: collection.requests.map(req =>
          req.name === currentRequest.name ? newRequest : req
        )
      })))
    } else {
      // Add new request to the first collection (you might want to let the user choose the collection)
      if (collections.length > 0) {
        setCollections(collections.map((collection, index) =>
          index === 0 ? { ...collection, requests: [...collection.requests, newRequest] } : collection
        ))
      } else {
        alert('Please create a collection first')
      }
    }

    setCurrentRequest(newRequest)
  }

  const handleRemoveRequestFromCollection = (collectionName: string, requestName: string) => {
    setCollections(collections.map(collection =>
      collection.name === collectionName
        ? {
          ...collection,
          requests: collection.requests.filter(req => req.name !== requestName)
        }
        : collection
    ))

    if (currentRequest && currentRequest.name === requestName) {
      setCurrentRequest(null)
      setRequestName('')
      setUrl('')
      setMethod('GET')
      setHeaders([{ key: '', value: '' }])
      setBody('')
    }
  }

  const handleExportCollection = (collection: Collection) => {
    const httpContent = collection.requests.map(request => {
      const headers = request.headers
        .filter(h => h.key && h.value) // Only include non-empty headers
        .map(h => `${h.key}: ${h.value}`)
        .join('\n')

      return `### ${request.name}
${request.method} ${request.url}
${headers ? `${headers}\n` : ''}
${request.body}

`
    }).join('\n')

    const blob = new Blob([httpContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${collection.name}.http`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportCollection = (importedCollection: Collection) => {
    setCollections([...collections, importedCollection])
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        collections={collections}
        onSaveCollection={handleSaveCollection}
        onAddRequestToCollection={handleAddRequestToCollection}
        onLoadRequest={handleLoadRequest}
        onRemoveRequestFromCollection={handleRemoveRequestFromCollection}
        onExportCollection={handleExportCollection}
        onImportCollection={handleImportCollection}
      />
      <div className="flex-1 overflow-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Postman Clone</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-2 mb-4">
            <Input
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              placeholder="Request name"
            />
            <Button type="button" onClick={handleSaveCurrentRequest}>
              {currentRequest ? 'Update Request' : 'Save New Request'}
            </Button>
          </div>
          <div className="flex space-x-2">
            <div className="flex-grow">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/endpoint"
              />
            </div>
            <div>
              <Label htmlFor="method">Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Headers</Label>
            {headers.map((header, index) => (
              <div key={index} className="flex space-x-2 mt-2">
                <Input
                  placeholder="Key"
                  value={header.key}
                  onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                />
                <Input
                  placeholder="Value"
                  value={header.value}
                  onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                />
              </div>
            ))}
            <Button type="button" onClick={handleAddHeader} className="mt-2">
              Add Header
            </Button>
          </div>

          <div>
            <Label htmlFor="body">Request Body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Request body (JSON)"
            />
          </div>

          <Button type="submit">Send Request</Button>
        </form>

        {response && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-2">Response</h2>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

