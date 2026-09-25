  import React from 'react';
  import { useApp } from '../context/AppContext';

  interface AcademicYearSelectorProps {
    className?: string;
    label?: string;
  }

  export const AcademicYearSelector: React.FC<
    AcademicYearSelectorProps
  > = ({
    className = '',
    label = 'Tahun Ajaran',
  }) => {
    const {
      academicYears,
      selectedAcademicYearId,
      setSelectedAcademicYearId,
    } = useApp();

    const handleChange = (
      event: React.ChangeEvent<HTMLSelectElement>
    ) => {
      const value = event.target.value;

      if (!value) {
        setSelectedAcademicYearId(null);
        return;
      }

      setSelectedAcademicYearId(
        Number(value)
      );
    };

    return (
      <div
        className={`flex flex-col gap-1.5 ${className}`}
      >
        {label && (
          <label
            htmlFor="academic-year-selector"
            className="text-sm font-semibold text-[#3B2A20]"
          >
            {label}
          </label>
        )}

        <select
          id="academic-year-selector"
          value={
            selectedAcademicYearId ?? ''
          }
          onChange={handleChange}
          className="
            h-10
            min-w-[160px]
            rounded-xl
            border-2
            border-[#3B2A20]
            bg-[#FFF9EF]
            px-3
            text-sm
            font-semibold
            text-[#3B2A20]
            outline-none
            transition
            hover:bg-[#FFF4DF]
            focus:ring-2
            focus:ring-[#3B2A20]
          "
        >
          <option value="">
            Pilih Tahun Ajaran
          </option>

          {academicYears.map((year) => (
            <option
              key={year.id}
              value={year.id}
            >
              {year.name}
              {year.isActive
                ? ' — Aktif'
                : ''}
            </option>
          ))}
        </select>
      </div>
    );
  };