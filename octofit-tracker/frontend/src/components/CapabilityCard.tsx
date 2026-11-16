import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Props<T> = {
  title: string;
  description: string;
  path: string;
  itemsKey: string;
  emptyMessage: string;
  renderItem: (item: T) => ReactNode;
};

export function CapabilityCard<T>({ title, description, path, itemsKey, emptyMessage, renderItem }: Props<T>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setItems(null);
    setError(null);

    getJson<Record<string, T[]>>(path).then((response) => {
      if (!Array.isArray(response[itemsKey])) {
        throw new Error('Unexpected response format');
      }
      if (active) setItems(response[itemsKey]);
    }).catch((requestError: unknown) => {
      if (active) {
        setError(requestError instanceof Error ? requestError.message : 'Unknown error');
      }
    });

    return () => {
      active = false;
    };
  }, [itemsKey, path]);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">{title}</h2>
    <p>{description}</p>
    {error !== null
      ? <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>
      : items === null
        ? <p role="status">Loading {title.toLowerCase()}...</p>
        : items.length === 0
          ? <p>{emptyMessage}</p>
          : <ul>{items.map((item, index) => <li key={index}>{renderItem(item)}</li>)}</ul>}
  </div></section>;
}
