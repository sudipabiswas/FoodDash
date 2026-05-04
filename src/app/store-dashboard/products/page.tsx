"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Package, 
  Plus, 
  Trash2, 
  X,
  AlertCircle,
  FolderPlus,
  ImagePlus,
  CheckCircle,
  Loader2
} from "lucide-react";
import Image from "next/image";

export default function StoreProductsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/store/products");
      const json = await res.json();
      if (res.ok) {
        setData(json);
        if (json.categories?.length > 0 && !newProduct.categoryId) {
          setNewProduct(prev => ({ ...prev, categoryId: json.categories[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setUploadedImageUrl(null);
    setUploadState("idle");
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    setUploadState("uploading");
    try {
      // 1. Get a presigned URL from our API
      const res = await fetch(
        `/api/upload?filename=${encodeURIComponent(imageFile.name)}&contentType=${encodeURIComponent(imageFile.type)}`
      );
      if (!res.ok) throw new Error("Failed to get upload URL");
      const { signedUrl, publicUrl } = await res.json();

      // 2. PUT the file directly to R2
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": imageFile.type },
        body: imageFile,
      });
      if (!uploadRes.ok) throw new Error("Failed to upload to R2");

      setUploadState("done");
      setUploadedImageUrl(publicUrl);
      return publicUrl;
    } catch (err) {
      console.error(err);
      setUploadState("error");
      return null;
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.categoryId) {
      alert("Please create a category first.");
      return;
    }

    let imageUrl = uploadedImageUrl;
    if (imageFile && !uploadedImageUrl) {
      imageUrl = await uploadImage();
    }

    try {
      const res = await fetch("/api/store/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newProduct, storeId: data.storeId, image: imageUrl }),
      });
      if (res.ok) {
        setShowAddModal(false);
        resetForm();
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setNewProduct({ name: "", description: "", price: "", categoryId: data?.categories?.[0]?.id || "" });
    setImageFile(null);
    setImagePreview(null);
    setUploadedImageUrl(null);
    setUploadState("idle");
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/store/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName, storeId: data.storeId }),
      });
      if (res.ok) {
        setNewCategoryName("");
        setShowCategoryModal(false);
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await fetch(`/api/store/products?id=${id}`, { method: "DELETE" });
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your menu items and categories.</p>
        </div>
        
        <div className="flex gap-4">
           <button 
             onClick={() => setShowCategoryModal(true)}
             className="flex items-center gap-2 px-6 py-3 border border-primary/20 bg-primary/5 text-primary rounded-2xl font-bold hover:bg-primary/10 transition-all"
           >
             <FolderPlus className="h-5 w-5" /> Add Category
           </button>
           <button 
             onClick={() => setShowAddModal(true)}
             className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold hover:shadow-xl hover:shadow-primary/20 transition-all"
           >
             <Plus className="h-5 w-5" /> Add New Product
           </button>
        </div>
      </div>

      {data?.categories?.length === 0 && (
         <div className="p-6 bg-orange-50 border border-orange-200 rounded-[2rem] flex items-center gap-4">
            <AlertCircle className="h-6 w-6 text-orange-600 shrink-0" />
            <div>
               <p className="font-bold text-orange-800">No categories found</p>
               <p className="text-sm text-orange-700">You need to create at least one category before you can add products.</p>
            </div>
            <button 
               onClick={() => setShowCategoryModal(true)}
               className="ml-auto px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700"
            >
               Create One Now
            </button>
         </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data?.products?.length === 0 ? (
           <div className="col-span-full py-20 text-center space-y-4 border-2 border-dashed rounded-[3rem]">
              <Package className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
              <p className="text-muted-foreground font-medium">No products added yet. Start by adding your first item!</p>
           </div>
        ) : (
          data?.products?.map((product: any) => (
            <div key={product.id} className="bg-card border rounded-[2.5rem] overflow-hidden group hover:shadow-xl transition-all border-b-4 border-b-transparent hover:border-b-primary">
               <div className="h-48 bg-muted flex items-center justify-center relative overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Package className="h-12 w-12 text-muted-foreground opacity-20" />
                  )}
                  <div className="absolute top-4 right-4 flex gap-2">
                     <button 
                        onClick={() => deleteProduct(product.id)}
                        className="p-2 bg-white/80 backdrop-blur hover:bg-destructive hover:text-white rounded-xl shadow-sm transition-all"
                     >
                        <Trash2 className="h-4 w-4" />
                     </button>
                  </div>
               </div>
               <div className="p-6 space-y-3">
                  <div className="flex items-start justify-between">
                     <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
                     <span className="font-extrabold text-primary">${product.price.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                  <div className="pt-2 flex items-center gap-2">
                     <span className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {product.category?.name}
                     </span>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-card border w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-extrabold">Add New Product</h2>
                 <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-2 hover:bg-muted rounded-full transition-colors">
                    <X className="h-6 w-6" />
                 </button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-6">
                 {/* Image Upload */}
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Product Image</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="relative w-full h-44 rounded-2xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 bg-muted/20 hover:bg-primary/5 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all overflow-hidden"
                    >
                      {imagePreview ? (
                        <>
                          <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <p className="text-white text-sm font-bold">Click to change</p>
                          </div>
                          {uploadState === "done" && (
                            <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                              <CheckCircle className="h-4 w-4" />
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <ImagePlus className="h-8 w-8 text-muted-foreground/40" />
                          <p className="text-sm text-muted-foreground font-medium">Click to upload product image</p>
                          <p className="text-xs text-muted-foreground/60">JPG, PNG, WEBP up to 5MB</p>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    {imageFile && uploadState !== "done" && (
                      <button
                        type="button"
                        onClick={uploadImage}
                        disabled={uploadState === "uploading"}
                        className="w-full py-2 text-sm font-bold bg-secondary text-secondary-foreground rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      >
                        {uploadState === "uploading" ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                        ) : (
                          <><ImagePlus className="h-4 w-4" /> Upload to Cloud</>
                        )}
                      </button>
                    )}
                    {uploadState === "done" && <p className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Image uploaded successfully</p>}
                    {uploadState === "error" && <p className="text-xs font-bold text-red-500">Upload failed. Check your R2 configuration.</p>}
                 </div>

                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Product Name</label>
                       <input
                          type="text"
                          required
                          className="w-full px-4 py-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          placeholder="e.g. Deluxe Whopper"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                       />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Price ($)</label>
                          <input
                             type="number"
                             step="0.01"
                             required
                             className="w-full px-4 py-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                             placeholder="9.99"
                             value={newProduct.price}
                             onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Category</label>
                          <select
                             className="w-full px-4 py-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                             value={newProduct.categoryId}
                             onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                          >
                             {data?.categories?.map((cat: any) => (
                               <option key={cat.id} value={cat.id}>{cat.name}</option>
                             ))}
                          </select>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Description</label>
                       <textarea
                          className="w-full px-4 py-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[100px]"
                          placeholder="What's in this dish?"
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                       />
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button 
                       type="button" 
                       onClick={() => { setShowAddModal(false); resetForm(); }}
                       className="flex-1 py-4 border rounded-xl font-bold hover:bg-muted transition-all"
                    >
                       Cancel
                    </button>
                    <button 
                       type="submit"
                       className="flex-1 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:shadow-lg transition-all"
                    >
                       Create Product
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-card border w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-extrabold">New Category</h2>
                 <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                    <X className="h-6 w-6" />
                 </button>
              </div>

              <form onSubmit={handleAddCategory} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Category Name</label>
                    <input
                       type="text"
                       required
                       autoFocus
                       className="w-full px-4 py-3 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                       placeholder="e.g. Burgers, Beverages, Desserts"
                       value={newCategoryName}
                       onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button 
                       type="button" 
                       onClick={() => setShowCategoryModal(false)}
                       className="flex-1 py-4 border rounded-xl font-bold hover:bg-muted transition-all"
                    >
                       Cancel
                    </button>
                    <button 
                       type="submit"
                       className="flex-1 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:shadow-lg transition-all"
                    >
                       Create Category
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
