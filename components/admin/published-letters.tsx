"use client"
import { Eye, Trash, MessageSquare, FileText, Heart } from "lucide-react"

export function PublishedLetters() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Published Letters</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Title</th>
              <th className="py-2 px-4 border-b">Author</th>
              <th className="py-2 px-4 border-b">Date Published</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 px-4 border-b">Example Letter 1</td>
              <td className="py-2 px-4 border-b">John Doe</td>
              <td className="py-2 px-4 border-b">2023-10-26</td>
              <td className="py-2 px-4 border-b">
                <div className="flex items-center space-x-2">
                  <button className="text-blue-500 hover:text-blue-700">
                    <Eye className="h-5 w-5" />
                  </button>
                  <button className="text-green-500 hover:text-green-700">
                    <MessageSquare className="h-5 w-5" />
                  </button>
                  <button className="text-yellow-500 hover:text-yellow-700">
                    <FileText className="h-5 w-5" />
                  </button>
                  <button className="text-red-500 hover:text-red-700">
                    <Trash className="h-5 w-5" />
                  </button>
                  <button className="text-pink-500 hover:text-pink-700">
                    <Heart className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
            <tr>
              <td className="py-2 px-4 border-b">Example Letter 2</td>
              <td className="py-2 px-4 border-b">Jane Smith</td>
              <td className="py-2 px-4 border-b">2023-10-25</td>
              <td className="py-2 px-4 border-b">
                <div className="flex items-center space-x-2">
                  <button className="text-blue-500 hover:text-blue-700">
                    <Eye className="h-5 w-5" />
                  </button>
                  <button className="text-green-500 hover:text-green-700">
                    <MessageSquare className="h-5 w-5" />
                  </button>
                  <button className="text-yellow-500 hover:text-yellow-700">
                    <FileText className="h-5 w-5" />
                  </button>
                  <button className="text-red-500 hover:text-red-700">
                    <Trash className="h-5 w-5" />
                  </button>
                  <button className="text-pink-500 hover:text-pink-700">
                    <Heart className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
