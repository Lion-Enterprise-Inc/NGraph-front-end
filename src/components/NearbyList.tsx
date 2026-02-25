'use client'

type NearbyItem = {
  uid: string;
  name: string;
  slug: string;
  logo_url: string | null;
  distance_m?: number;
  address: string | null;
  city?: string | null;
  menu_count?: number;
};

type NearbyListProps = {
  items: NearbyItem[];
  onSelect: (slug: string) => void;
  showDistance?: boolean;
  isJa?: boolean;
};

export default function NearbyList({ items, onSelect, showDistance = true, isJa = true }: NearbyListProps) {
  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px', color: 'rgba(255,255,255,0.5)' }}>
        近くにレストランが見つかりませんでした
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(255,255,255,0.06)' }}>
      {items.map((item) => (
        <button
          key={item.uid}
          type="button"
          onClick={() => onSelect(item.slug)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            background: 'rgba(255,255,255,0.03)',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0,
              background: 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            {item.logo_url ? (
              <img src={item.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              item.name.charAt(0)
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.name}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {showDistance && item.distance_m != null ? (
                <>
                  {item.distance_m < 1000
                    ? `${Math.round(item.distance_m)}m`
                    : `${(item.distance_m / 1000).toFixed(1)}km`}
                  {item.city && ` · ${item.city}`}
                </>
              ) : (
                <>
                  {item.city || item.address || ''}
                  {item.menu_count != null && item.menu_count > 0 && ` · ${item.menu_count}${isJa ? '品' : ' items'}`}
                </>
              )}
            </div>
          </div>
          {showDistance && item.distance_m != null && (
            <div style={{ flexShrink: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
              {item.distance_m < 1000
                ? `${Math.round(item.distance_m)}m`
                : `${(item.distance_m / 1000).toFixed(1)}km`}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
