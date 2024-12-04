import React from 'react';
import LoadingSpinner from '../../utils/LoadingSpinner';

interface Table {
    tableNum: number;
    numSeats: number;
}

interface EditTablesPopupProps {
    tables: Table[];
    newTable: { tableNum: string; numSeats: string };
    onNewTableChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onAddTable: () => void;
    onDeleteTable: (tableNum: number) => void;
    onClose: () => void;
    loading: boolean;
    responseMsg: string;
    errorMessage: string;
}

export const EditTablesPopup: React.FC<EditTablesPopupProps> = ({
    tables,
    newTable,
    onNewTableChange,
    onAddTable,
    onDeleteTable,
    onClose,
    loading,
    responseMsg,
    errorMessage
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-96">
                <h2 className="text-xl font-semibold mb-4">Edit Tables</h2>
                <form className="space-y-4">
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Add Table</label>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={newTable.tableNum}
                                name="tableNum"
                                placeholder="Table Number"
                                className="w-1/2 border border-gray-300 rounded py-2 px-4 focus:outline-none focus:ring focus:ring-blue-300"
                                onChange={onNewTableChange}
                            />
                            <input
                                type="text"
                                value={newTable.numSeats}
                                name="numSeats"
                                placeholder="Seats"
                                className="w-1/2 border border-gray-300 rounded py-2 px-4 focus:outline-none focus:ring focus:ring-blue-300"
                                onChange={onNewTableChange}
                            />
                        </div>
                    </div>
                </form>

                <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Existing Tables</h3>
                    <ul className="space-y-4">
                        {tables.map((table) => (
                            <li key={table.tableNum} className="flex justify-between items-center">
                                <span>
                                    Table {table.tableNum} - {table.numSeats} seats
                                </span>
                                <button
                                    className="bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600 transition"
                                    onClick={() => onDeleteTable(table.tableNum)}
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {loading && <LoadingSpinner />}
                {responseMsg ? (
                    <div className="mt-8 p-4 border rounded bg-green-50">
                        <h2 className="text-xl font-semibold mb-2">Success!</h2>
                        <p>{responseMsg}</p>
                    </div>
                ) : errorMessage ? (
                    <div className="mt-8 p-4 border rounded bg-red-50">
                        <p>{errorMessage}</p>
                    </div>
                ) : null}

                <div className="flex justify-between items-center mt-6">
                    <button
                        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
                        onClick={onAddTable}
                    >
                        Add Table
                    </button>
                    <button
                        className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
