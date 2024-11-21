'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { RequestList } from './RequestList'

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

interface CollectionManagerProps {
  collections: Collection[]
  onSaveCollection: (collection: Collection) => void
  onLoadCollection: (collection: Collection) => void
  onAddRequestToCollection: (collectionName: string) => void
  onLoadRequest: (request: Request) => void
  onRemoveRequestFromCollection: (collectionName: string, requestName: string) => void
}

export function CollectionManager({ 
  collections, 
  onSaveCollection, 
  onLoadCollection, 
  onAddRequestToCollection,
  onLoadRequest,
  onRemoveRequestFromCollection
}: CollectionManagerProps) {
  const [newCollectionName, setNewCollectionName] = useState('')

  const handleSaveCollection = () => {
    if (newCollectionName) {
      const newCollection: Collection = {
        name: newCollectionName,
        requests: []
      }
      onSaveCollection(newCollection)
      setNewCollectionName('')
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

  const handleImportCollection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        const requests = content.split('###').slice(1).map(requestStr => {
          const [name, ...lines] = requestStr.trim().split('\n')
          const [method, url] = lines[0].split(' ')
          const headerEnd = lines.findIndex(line => line === '')
          const headers = lines.slice(1, headerEnd).map(header => {
            const [key, value] = header.split(': ')
            return { key, value }
          })
          const body = lines.slice(headerEnd + 1).join('\n')
          return { name: name.trim(), url, method, headers, body }
        })
        const newCollection: Collection = {
          name: file.name.replace('.http', ''),
          requests
        }
        onSaveCollection(newCollection)
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold mb-2">Collections</h2>
      <div className="flex space-x-2 mb-2">
        <Input
          value={newCollectionName}
          onChange={(e) => setNewCollectionName(e.target.value)}
          placeholder="New collection name"
        />
        <Button onClick={handleSaveCollection}>Create Collection</Button>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {collections.map((collection, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger>{collection.name}</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Button onClick={() => onAddRequestToCollection(collection.name)}>Add Request</Button>
                  <Button onClick={() => handleExportCollection(collection)}>Export</Button>
                </div>
                <RequestList 
                  requests={collection.requests} 
                  onSelectRequest={onLoadRequest}
                  onRemoveRequest={(requestName) => onRemoveRequestFromCollection(collection.name, requestName)}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="mt-2">
        <Input
          type="file"
          accept=".http"
          onChange={handleImportCollection}
        />
      </div>
    </div>
  )
}

