import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ChevronRight, Plus, Trash, Download, Upload } from 'lucide-react'

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

interface SidebarProps {
  collections: Collection[]
  onSaveCollection: (collection: Collection) => void
  onAddRequestToCollection: (collectionName: string) => void
  onLoadRequest: (request: Request) => void
  onRemoveRequestFromCollection: (collectionName: string, requestName: string) => void
  onExportCollection: (collection: Collection) => void
  onImportCollection: (collection: Collection) => void
}

export function Sidebar({
  collections,
  onSaveCollection,
  onAddRequestToCollection,
  onLoadRequest,
  onRemoveRequestFromCollection,
  onExportCollection,
  onImportCollection
}: SidebarProps) {
  const [newCollectionName, setNewCollectionName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    onExportCollection(collection)
  }

  const handleImportCollection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const importedCollection = parseHttpFile(content)
          onImportCollection(importedCollection)
        } catch (error) {
          console.error('Error importing collection:', error)
          alert('Failed to import collection. Please make sure the file is valid.')
        }
      }
      reader.readAsText(file)
    }
  }

  function parseHttpFile(content: string): Collection {
    const requests = content.split('###').slice(1).map(requestStr => {
      const [name, ...lines] = requestStr.trim().split('\n')
      const [method, url] = lines[0].split(' ')
      const headerEnd = lines.findIndex(line => line === '')
      const headers = lines.slice(1, headerEnd)
        .filter(header => header.includes(':'))
        .map(header => {
          const [key, value] = header.split(':').map(s => s.trim())
          return { key, value }
        })
      const body = lines.slice(headerEnd + 1).join('\n')
      return { name: name.trim(), url, method, headers, body }
    })
    return { name: 'Imported Collection', requests }
  }

  return (
    <div className="w-64 border-r h-screen flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Collections</h2>
        <div className="flex space-x-2">
          <Input
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            placeholder="New collection name"
          />
          <Button onClick={handleSaveCollection} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2 flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportCollection}
            accept=".http"
            className="hidden"
          />
        </div>
      </div>
      <ScrollArea className="flex-grow">
        <Accordion type="multiple" className="w-full">
          {collections.map((collection, index) => (
            <AccordionItem value={`item-${index}`} key={index}>
              <AccordionTrigger className="px-4 py-2 text-sm">
                {collection.name}
              </AccordionTrigger>
              <AccordionContent>
                <div className="pl-4 space-y-1">
                  {collection.requests.map((request, reqIndex) => (
                    <div key={reqIndex} className="flex items-center justify-between pr-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => onLoadRequest(request)}
                      >
                        <ChevronRight className="h-4 w-4 mr-2" />
                        {request.name}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveRequestFromCollection(collection.name, request.name)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onAddRequestToCollection(collection.name)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Request
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleExportCollection(collection)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Collection
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </div>
  )
}

