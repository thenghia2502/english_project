"use client"

import { useEffect, useRef, useState } from "react"
import { X } from "lucide-react"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function ModalAddWords({ unitId, onClose }: { unitId: string, onClose: () => void }) {
    const [rows, setRows] = useState<Array<{ id: string; text: string; meaning: string; ukIpa: string; usIpa: string }>>([
        { id: "", text: "", meaning: "", ukIpa: "", usIpa: "" }
    ])
    // Lưu rows theo từng unitId để mỗi unit có dữ liệu riêng
    const rowsByUnitRef = useRef<Record<string, Array<{ id: string; text: string; meaning: string; ukIpa: string; usIpa: string }>>>({})

    // Khi unitId thay đổi, đồng bộ rows tương ứng
    useEffect(() => {
        const exist = rowsByUnitRef.current[unitId]
        if (exist && Array.isArray(exist)) {
            setRows(exist)
        } else {
            const initial = [{ id: "", text: "", meaning: "", ukIpa: "", usIpa: "" }]
            rowsByUnitRef.current[unitId] = initial
            setRows(initial)
        }
    }, [unitId])

    const fetchIpa = async (value: string, idx: number) => {
        if (!value.trim()) return;

        const res = await fetch(`/api/proxy/words/get_ipa?words=${encodeURIComponent(value)}`);
        const data = await res.json();

        console.log("API data:", data);

        setRows(prev => {
            const updated = [...prev];
            updated[idx] = {
                ...updated[idx],
                id: data.id || "",
                ukIpa: data.ukIPA || "",
                usIpa: data.usIPA || "",
            };
            console.log("Updated row:", updated[idx]);
            return updated;
        });
    };

    const handleChange = (idx: number, field: "text" | "meaning" | "ukIpa" | "usIpa", value: string) => {
        try {
            value = value.normalize("NFC");

            setRows(prev => {
                const next = prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
                rowsByUnitRef.current[unitId] = next
                return next
            });

        } catch (e) {
            console.error("Error normalizing string:", e);
        }
    };


    const addRow = () => setRows(prev => {
        const next = [...prev, { id: "", text: "", meaning: "", ukIpa: "", usIpa: "" }]
        rowsByUnitRef.current[unitId] = next
        return next
    })
    const removeRow = (idx: number) => setRows(prev => {
        const next = prev.filter((_, i) => i !== idx)
        rowsByUnitRef.current[unitId] = next.length ? next : [{ id: "", text: "", meaning: "", ukIpa: "", usIpa: "" }]
        return rowsByUnitRef.current[unitId]
    })
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        const lastIndex = rows.length - 1;
        const ref = inputRefs.current[lastIndex];
        if (ref) ref.focus();
    }, [rows.length]);

    const handleSubmit = async () => {
        try {
            const res = await fetch('/api/proxy/words/add_word_to_unit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wordId: rows[0].id,
                    unitId: unitId
                })
            });
            const data = await res.json();
            console.log("Submit response:", data);
        } catch (e) {
            console.error("Error submitting words:", e);
        }
    }
    return (
        <div className="modal fixed inset-0 flex items-center justify-center z-[90]">
            <div className="fixed inset-0 bg-gray-500/75" />
            <div className="text-black modal-content relative flex flex-col z-10 w-[95%] max-w-6xl bg-white rounded-lg shadow-xl overflow-visible">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Thêm từ vào unit {unitId}</h2>
                    <button
                        onClick={() => onClose()}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        // disabled={isSubmitting}
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="p-4">
                    <div className="overflow-x-auto rounded-md border border-gray-200">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[30%]">Text</TableHead>
                                    <TableHead className="w-[35%]">Meaning</TableHead>
                                    <TableHead className="w-[17.5%]">UK IPA</TableHead>
                                    <TableHead className="w-[17.5%]">US IPA</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((row, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>
                                            <Input
                                                ref={el => { inputRefs.current[idx] = el; }}
                                                placeholder="e.g. notebook"
                                                value={row.text}
                                                onChange={(e) => handleChange(idx, "text", e.target.value)}
                                                onBlur={() => fetchIpa(rows[idx].text, idx)}

                                                onKeyDown={e => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();   // ngăn xuống dòng
                                                        addRow();             // thêm dòng mới
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                placeholder="e.g. quyển vở"
                                                value={row.meaning}
                                                onChange={(e) => handleChange(idx, "meaning", e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                key={row.ukIpa + idx}       // ép rerender khi IPA thay đổi
                                                placeholder="e.g. /ˈnəʊtbʊk/"
                                                value={row.ukIpa}
                                                onChange={(e) => handleChange(idx, "ukIpa", e.target.value)}
                                            />

                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    key={row.usIpa + idx}
                                                    placeholder="e.g. /ˈnoʊtbʊk/"
                                                    value={row.usIpa}
                                                    onChange={(e) => handleChange(idx, "usIpa", e.target.value)}
                                                />

                                                {rows.length > 1 && (
                                                    <Button variant="ghost" size="sm" onClick={() => removeRow(idx)}>
                                                        Xóa
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="mt-3 flex justify-between">
                        <Button variant="outline" onClick={addRow}>Thêm dòng</Button>
                        <div className="text-sm text-gray-500">{rows.length} dòng</div>
                    </div>
                    <div>
                        <Button className="mt-4 float-right" onClick={() => handleSubmit()}>Lưu từ</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}