export function HeadersTable({ headers }: { headers: [string, string][] }) {
  if (headers.length === 0) {
    return <p className="text-sm text-gray-500">No headers.</p>;
  }

  return (
    <table className="w-full text-sm">
      <tbody>
        {headers.map(([key, value], i) => (
          <tr key={`${key}-${i}`} className="border-b align-top">
            <td className="py-1 pr-4 font-mono font-medium whitespace-nowrap">
              {key}
            </td>
            <td className="py-1 font-mono break-all">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
