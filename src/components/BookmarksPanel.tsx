import { X, Bookmark } from 'lucide-react';
import type { Activity } from '../types/trip';
import { getActivityTypeColor } from '../utils/colors';

interface BookmarksPanelProps {
  bookmarks: Activity[];
  onClose: () => void;
  onBookmarkClick: (activity: Activity) => void;
}

export default function BookmarksPanel({ bookmarks, onClose, onBookmarkClick }: BookmarksPanelProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-premium-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-yellow-50 to-amber-50 border-b-2 border-yellow-200 px-6 py-5 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-400 shadow-sm">
              <Bookmark className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bookmarks</h2>
              <p className="text-sm text-gray-600">Places saved for later</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-yellow-100 rounded-lg transition-colors border border-yellow-300"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {bookmarks.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-50 mb-4">
                <Bookmark className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookmarks yet</h3>
              <p className="text-sm text-gray-600 mb-4">
                Save places you're interested in without scheduling them to a specific day
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
                <p className="text-sm text-blue-900 font-medium mb-2">💡 How to add bookmarks:</p>
                <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
                  <li>Click "+ Add Place" button</li>
                  <li>Fill in the place details</li>
                  <li>Select "📌 No day (bookmark only)" from the Day dropdown</li>
                  <li>Click "Add Activity"</li>
                </ol>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''}
                </p>
                <div className="text-xs text-gray-500">
                  💡 Click Edit to assign to a day
                </div>
              </div>

              <div className="grid gap-3">
                {bookmarks.map((activity) => {
                  const typeInfo = getActivityTypeColor(activity.type);
                  return (
                    <div
                      key={activity.id}
                      className="bg-white border-2 border-gray-200 hover:border-yellow-400 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md group"
                      onClick={() => onBookmarkClick(activity)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Image */}
                        {activity.imageUrl ? (
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            <img
                              src={activity.imageUrl}
                              alt={activity.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            className="w-20 h-20 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: `${typeInfo.color}15`,
                            }}
                          >
                            <span className="text-3xl">{typeInfo.emoji}</span>
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-2">
                            <h3 className="text-base font-semibold text-gray-900 group-hover:text-travel-teal transition-colors flex-1">
                              {activity.name}
                            </h3>
                            <span
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold flex-shrink-0"
                              style={{
                                backgroundColor: `${typeInfo.color}15`,
                                color: typeInfo.color,
                              }}
                            >
                              {typeInfo.emoji} {typeInfo.name}
                            </span>
                          </div>

                          {/* Rating */}
                          {activity.rating && (
                            <div className="flex items-center gap-1 mb-2">
                              <span className="text-yellow-500">⭐</span>
                              <span className="text-sm font-semibold text-gray-700">{activity.rating}</span>
                            </div>
                          )}

                          {/* Description */}
                          {activity.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {activity.description}
                            </p>
                          )}

                          {/* Address */}
                          {activity.address && (
                            <p className="text-xs text-gray-500 truncate">
                              📍 {activity.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
