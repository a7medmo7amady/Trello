import { memo } from 'react';

/**
 * ConflictResolutionModal Component
 *
 * Displays a side-by-side comparison of local and server versions of a conflicted item.
 * Allows the user to choose which version to keep.
 */
const ConflictResolutionModal = ({
    conflict,
    onResolve,
}) => {
    // Guard against invalid conflict data
    if (!conflict || !conflict.localVersion || !conflict.serverVersion) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="bg-neutral-900 border border-red-900/30 rounded-2xl p-6 text-white text-center">
                    <p className="mb-2">Conflict data incomplete</p>
                    <p className="text-gray-400 text-sm mb-4">Local or server version missing</p>
                    <button
                        onClick={() => onResolve('server')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg"
                    >
                        Dismiss & Use Server
                    </button>
                </div>
            </div>
        );
    }

    const { localVersion, serverVersion, type } = conflict;

    const DiffField = ({ label, local, server }) => {
        const isDifferent = JSON.stringify(local) !== JSON.stringify(server);
        if (!local && !server) return null;

        return (
            <div className="mb-4">
                <div className="text-xs font-semibold text-gray-500 mb-1">{label}</div>
                <div className={`grid grid-cols-2 gap-4 ${isDifferent ? 'bg-red-900/10 rounded-lg p-2 -m-2' : ''}`}>
                    <div className="text-sm text-gray-300 break-words">
                        {local || <span className="text-gray-600 italic">Empty</span>}
                    </div>
                    <div className="text-sm text-gray-300 break-words">
                        {server || <span className="text-gray-600 italic">Empty</span>}
                    </div>
                </div>
            </div>
        );
    };

    const renderTags = (tags) => {
        if (!tags || tags.length === 0) return null;
        return (
            <div className="flex flex-wrap gap-1">
                {tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 text-xs bg-neutral-800 rounded-full text-gray-300 border border-gray-700">
                        {tag}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-2xl bg-neutral-900 border border-red-900/30 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
                aria-labelledby="conflict-title"
            >
                {/* Header */}
                <div className="flex items-start gap-4 p-6 border-b border-gray-800">
                    <div className="p-3 rounded-full bg-amber-500/10">
                        <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h2 id="conflict-title" className="text-xl font-semibold text-white">
                            Sync Conflict Detected
                        </h2>
                        <p className="mt-1 text-sm text-gray-400">
                            Changes were made to this {type} on another device. Please Review the differences and choose which version to keep.
                        </p>
                    </div>
                </div>

                {/* Comparison Body */}
                <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-4 pb-2 border-b border-gray-800">
                        <div className="text-sm font-medium text-amber-500">Your Changes (Local)</div>
                        <div className="text-sm font-medium text-blue-400">Server Version</div>
                    </div>

                    <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                        <DiffField
                            label="Title"
                            local={localVersion?.title}
                            server={serverVersion?.title}
                        />

                        {type === 'card' && (
                            <>
                                <DiffField
                                    label="Description"
                                    local={localVersion?.description}
                                    server={serverVersion?.description}
                                />
                                <DiffField
                                    label="Tags"
                                    local={renderTags(localVersion?.tags)}
                                    server={renderTags(serverVersion?.tags)}
                                />
                            </>
                        )}

                        <DiffField
                            label="Last Modified"
                            local={localVersion?.lastModifiedAt ? new Date(localVersion.lastModifiedAt).toLocaleString() : 'Unknown'}
                            server={serverVersion?.lastModifiedAt ? new Date(serverVersion.lastModifiedAt).toLocaleString() : 'Unknown'}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-800 bg-neutral-900/50 rounded-b-2xl">
                    <button
                        onClick={() => onResolve('local')}
                        className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    >
                        Keep My Changes
                    </button>
                    <button
                        onClick={() => onResolve('server')}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    >
                        Use Server Version
                    </button>
                </div>
            </div>
        </div>
    );
};

export default memo(ConflictResolutionModal);
