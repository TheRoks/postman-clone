import { Button } from "@/components/ui/button"

interface Request {
  name: string
  url: string
  method: string
  headers: { key: string; value: string }[]
  body: string
}

interface RequestListProps {
  requests: Request[]
  onSelectRequest: (request: Request) => void
  onRemoveRequest: (requestName: string) => void
}

export function RequestList({ requests, onSelectRequest, onRemoveRequest }: RequestListProps) {
  return (
    <div className="space-y-2">
      {requests.map((request, index) => (
        <div key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded">
          <div>
            <span className="font-medium">{request.name}</span>
            <span className="ml-2 text-sm text-gray-500">{request.method}</span>
          </div>
          <div>
            <Button onClick={() => onSelectRequest(request)} className="mr-2">Load</Button>
            <Button 
              onClick={() => onRemoveRequest(request.name)} 
              variant="destructive"
              size="sm"
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

