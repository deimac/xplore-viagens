import { trpc } from "@/lib/trpc";

export default function TRPCDebug() {
  const travelsQuery = trpc.travels.list.useQuery(undefined);
  
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 0, 
      right: 0, 
      background: 'white', 
      border: '2px solid red', 
      padding: '10px',
      maxWidth: '400px',
      maxHeight: '300px',
      overflow: 'auto',
      zIndex: 9999,
      fontSize: '12px'
    }}>
      <h3 style={{ color: 'red', margin: 0 }}>TRPC Debug</h3>
      <div>
        <strong>isLoading:</strong> {String(travelsQuery.isLoading)}
      </div>
      <div>
        <strong>isError:</strong> {String(travelsQuery.isError)}
      </div>
      <div>
        <strong>error:</strong> {travelsQuery.error?.message || 'null'}
      </div>
      <div>
        <strong>data type:</strong> {typeof travelsQuery.data}
      </div>
      <div>
        <strong>data:</strong> {travelsQuery.data ? JSON.stringify(travelsQuery.data, null, 2).substring(0, 500) : 'null'}
      </div>
    </div>
  );
}
