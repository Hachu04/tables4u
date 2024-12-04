import React from 'react';
import LoadingSpinner from '../../utils/LoadingSpinner';

interface EditRestaurantPopupProps {
    restaurantData: {
        name: string;
        address: string;
        openingHour: string;
        closingHour: string;
    };
    onClose: () => void;
    onSave: () => void;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    loading: boolean;
    responseMsg: string;
    errorMessage: string;
}

export const EditRestaurantPopup: React.FC<EditRestaurantPopupProps> = ({
    restaurantData,
    onClose,
    onSave,
    onInputChange,
    loading,
    responseMsg,
    errorMessage
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-96">
                <h2 className="text-xl font-semibold mb-4">Edit Restaurant</h2>
                <form className="space-y-4">
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">
                            Restaurant Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={restaurantData.name}
                            onChange={onInputChange}
                            className="w-full border border-gray-300 rounded py-2 px-4 focus:outline-none focus:ring focus:ring-blue-300"
                            placeholder="Enter restaurant name"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 font-medium mb-2">
                            Address
                        </label>
                        <input
                            type="text"
                            name="address"
                            value={restaurantData.address}
                            onChange={onInputChange}
                            className="w-full border border-gray-300 rounded py-2 px-4 focus:outline-none focus:ring focus:ring-blue-300"
                            placeholder="Enter restaurant address"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 font-medium mb-2">
                            Hours of Operation
                        </label>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                name="openingHour"
                                value={restaurantData.openingHour}
                                onChange={onInputChange}
                                className="w-1/2 border border-gray-300 rounded py-2 px-4 focus:outline-none focus:ring focus:ring-blue-300"
                                placeholder="Opening hour"
                            />
                            <input
                                type="text"
                                name="closingHour"
                                value={restaurantData.closingHour}
                                onChange={onInputChange}
                                className="w-1/2 border border-gray-300 rounded py-2 px-4 focus:outline-none focus:ring focus:ring-blue-300"
                                placeholder="Closing hour"
                            />
                        </div>
                    </div>
                </form>

                <div className="flex justify-end space-x-4 mt-6">
                    <button
                        className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
                        onClick={onSave}
                    >
                        Save Changes
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
