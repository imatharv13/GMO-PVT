import { useState, useEffect, useRef } from 'react';
import { DataTable, DataTableStateEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputNumber, InputNumberValueChangeEvent } from 'primereact/inputnumber';
import { fetchArtworks } from './services/api';
import { Artwork } from './types';

interface CustomSelectionIntent {
    remaining: number;
}

const ROWS_PER_PAGE = 12;

export default function App() {
    const [artworks, setArtworks] = useState<Artwork[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());
    const [selectionIntent, setSelectionIntent] = useState<CustomSelectionIntent | null>(null);
    const [selectCount, setSelectCount] = useState<number | null>(null);

    const op = useRef<OverlayPanel>(null);

    
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const res = await fetchArtworks(page);
                setArtworks(res.data || []);
                setTotalRecords(res.pagination.total || 0);
            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [page]);


    useEffect(() => {
        // Automatically selects rows as they load until the 'remaining' count is met
        if (!loading && selectionIntent && selectionIntent.remaining > 0 && artworks.length > 0) {
            const currentIds = artworks.map((a) => a.id);
            const unselectedOnPage = currentIds.filter((id) => !selectedRowIds.has(id));

            const toSelectCount = Math.min(selectionIntent.remaining, unselectedOnPage.length);

            if (toSelectCount > 0) {
                const batch = unselectedOnPage.slice(0, toSelectCount);
                
                setSelectedRowIds((prev) => {
                    const next = new Set(prev);
                    batch.forEach((id) => next.add(id));
                    return next;
                });

                setSelectionIntent((prev) => {
                    if (!prev) return null;
                    const newRemaining = prev.remaining - toSelectCount;
                    
                    
                    if (newRemaining > 0 && page * ROWS_PER_PAGE < totalRecords) {
                        setPage((prevPage) => prevPage + 1);
                        return { remaining: newRemaining };
                    }
                    return null;
                });
            }
        }
    }, [artworks, loading, selectionIntent, totalRecords, page, selectedRowIds]);


    const applyCustomSelection = () => {
        if (selectCount && selectCount > 0) {
            setSelectedRowIds(new Set());
            setSelectionIntent({ remaining: selectCount });
            op.current?.hide();
        }
    };

    const handleSelectionChange = (e: { value: any }) => {
        
        if (selectionIntent) setSelectionIntent(null);

        const newSelection = (e.value as unknown) as Artwork[];
        
        if (!Array.isArray(newSelection)) return;

        const currentPageIds = artworks.map((a) => a.id);

        setSelectedRowIds((prev) => {
            const next = new Set(prev);
            currentPageIds.forEach((id) => next.delete(id));
            newSelection.forEach((art) => {
                if (art && art.id) next.add(art.id);
            });
            return next;
        });
    };

    const selectionHeader = (
        <div className="flex align-items-center">
            <Button
                type="button"
                icon="pi pi-chevron-down"
                className="p-button-text p-button-sm p-0"
                style={{ width: '2rem', height: '2rem' }}
                onClick={(e) => op.current?.toggle(e)}
                tooltip="Select specific amount"
            />
        </div>
    );

    return (
        <div className="card p-4" style={{ maxWidth: '1200px', margin: '2rem auto' }}>
            <div className="flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="m-0">Art Institute of Chicago</h2>
                    <p className="text-600 mt-2">
                        Total Selected: <span className="font-bold text-primary">{selectedRowIds.size}</span>
                    </p>
                </div>

                {selectedRowIds.size > 0 && (
                    <Button
                        label="Clear Selection"
                        icon="pi pi-trash"
                        className="p-button-danger p-button-text"
                        onClick={() => {
                            setSelectedRowIds(new Set());
                            setSelectionIntent(null);
                        }}
                    />
                )}
            </div>

            <DataTable
                value={artworks}
                lazy
                paginator
                rows={ROWS_PER_PAGE}
                first={(page - 1) * ROWS_PER_PAGE}
                totalRecords={totalRecords}
                onPage={(e: DataTableStateEvent) => setPage((e.page ?? 0) + 1)}
                loading={loading}
                dataKey="id"
                
                selection={artworks.filter((art) => selectedRowIds.has(art.id))}
                onSelectionChange={handleSelectionChange}
                responsiveLayout="stack"
                breakpoint="960px"
            >
                <Column selectionMode="multiple" header={selectionHeader} style={{ width: '3rem' }} />
                <Column field="title" header="Title" />
                <Column field="place_of_origin" header="Place of Origin" />
                <Column field="artist_display" header="Artist" />
                <Column field="date_start" header="Start Date" />
                <Column field="date_end" header="End Date" />
            </DataTable>

            <OverlayPanel ref={op} showCloseIcon>
                <div className="flex flex-column gap-3 p-2" style={{ minWidth: '220px' }}>
                    <span className="font-bold">Select Rows</span>
                    <InputNumber
                        value={selectCount}
                        onValueChange={(e: InputNumberValueChangeEvent) => setSelectCount(e.value ?? null)}
                        placeholder="Enter quantity..."
                        min={0}
                        max={totalRecords}
                        autoFocus
                    />
                    <Button label="Submit" onClick={applyCustomSelection} />
                </div>
            </OverlayPanel>
        </div>
    );
}