import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FileDropZone from '../FileDropZone';

describe('FileDropZone', () => {
    it('calls onFileSelected when a file is chosen via the hidden input', () => {
        const onFileSelected = vi.fn();
        render(<FileDropZone label="Employees" file={null} onFileSelected={onFileSelected} />);

        const file = new File(['id_zamestnance,jmeno\n'], 'employees.csv', { type: 'text/csv' });
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        expect(onFileSelected).toHaveBeenCalledWith(file);
    });

    it('shows the selected filename once a file is provided', () => {
        const file = new File(['content'], 'employees.csv', { type: 'text/csv' });
        render(<FileDropZone label="Employees" file={file} onFileSelected={vi.fn()} />);

        expect(screen.getByText('employees.csv')).toBeInTheDocument();
    });

    it('calls onFileSelected with the dropped file', () => {
        const onFileSelected = vi.fn();
        render(<FileDropZone label="Employees" file={null} onFileSelected={onFileSelected} />);

        const file = new File(['content'], 'dropped.csv', { type: 'text/csv' });
        const dropZone = screen.getByText('Drag & drop or click to browse').closest('[role="button"]') as HTMLElement;

        fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });

        expect(onFileSelected).toHaveBeenCalledWith(file);
    });
});
