import React from 'react';
import LoadingSpinner from '../../utils/LoadingSpinner';

interface ActivateRestaurantPopupProps {
    onClose: () => void;
    onConfirm: () => void;
    loading: boolean;
    responseMsg: string;
    errorMessage: string;
}

export const ActivateRestaurantPopup: React.FC<ActivateRestaurantPopupProps> = ({
    onClose,
    onConfirm,
    loading,
    responseMsg,
    errorMessage
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-96">
                <h2 className="text-xl font-semibold mb-4">Activate Restaurant?</h2>

                <div className="flex justify-end space-x-4 mt-6">
                    <button
                        className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
                        onClick={onConfirm}
                    >
                        Confirm
                    </button>
                </div>

                {loading && <LoadingSpinner />}
                {responseMsg ? (
                    <div className="mt-8 p-4 border rounded bg-green-50">
                        <h2 className="text-xl font-semibold mb-2">Success!</h2>
                        <p>{responseMsg}</p>
                        <button
                            className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                ) : errorMessage ? (
                    <div className="mt-8 p-4 border rounded bg-red-50">
                        <h2 className="text-xl font-semibold mb-2">Error</h2>
                        <p>{errorMessage}</p>
                    </div>
                ) : null}
            </div>
        </div>
    );
};