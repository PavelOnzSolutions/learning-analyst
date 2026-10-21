import { useRef, useState } from 'react';
import { FileCheck2, UploadCloud } from 'lucide-react';
import { Text } from '@radix-ui/themes';

interface FileDropZoneProps {
    label: string;
    file: File | null;
    onFileSelected: (file: File | null) => void;
}

export default function FileDropZone({ label, file, onFileSelected }: FileDropZoneProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleFiles = (files: FileList | null) => {
        if (files && files.length > 0) {
            onFileSelected(files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => setIsDragOver(false);

    const handleClick = () => inputRef.current?.click();

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors
                ${isDragOver ? 'border-(--accent-9) bg-(--accent-2)' : 'border-(--gray-6)'}
                ${file ? 'border-(--green-9)' : ''}`}
        >
            <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
            />
            {file ? (
                <>
                    <FileCheck2 className="w-6 h-6 text-(--green-9)" />
                    <Text size="2" weight="bold">{label}</Text>
                    <Text size="1" color="gray">{file.name}</Text>
                </>
            ) : (
                <>
                    <UploadCloud className="w-6 h-6 text-(--gray-9)" />
                    <Text size="2" weight="bold">{label}</Text>
                    <Text size="1" color="gray">Drag & drop or click to browse</Text>
                </>
            )}
        </div>
    );
}
