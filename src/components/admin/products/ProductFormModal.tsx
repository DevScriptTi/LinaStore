"use client";

import React, { useState, useEffect, useRef } from "react";
import { IProduct, ICategory, IProductImage } from "@/types";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, addDoc, doc, updateDoc, serverTimestamp, query, where } from "firebase/firestore";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { formatCurrency } from "@/lib/utils";
import { 
  X, 
  Package, 
  Layers, 
  UploadCloud, 
  Plus, 
  Minus,
  Trash2, 
  Check, 
  Loader2, 
  Sparkles, 
  Image as ImageIcon,
  Star,
  AlertCircle,
  Search
} from "lucide-react";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productToEdit?: IProduct | null;
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSuccess,
  productToEdit,
}: ProductFormModalProps) {
  const [productType, setProductType] = useState<"product" | "bundle">("product");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [compareAtPrice, setCompareAtPrice] = useState<number | null>(null);
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<IProductImage[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isFreeShipping, setIsFreeShipping] = useState<boolean>(false);
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(4.9);
  const [bundleItems, setBundleItems] = useState<{ productId?: string; title: string; image: string; quantity: number }[]>([]);

  // Smart Search Autocomplete State & Ref for Bundles
  const [availableProducts, setAvailableProducts] = useState<IProduct[]>([]);
  const [bundleSearchQuery, setBundleSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Click Outside Listener for Autocomplete Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch categories & available single products for dropdown
  useEffect(() => {
    if (isOpen) {
      setRemovedImages([]);
      setBundleSearchQuery("");
      setIsSearchFocused(false);

      const fetchCategories = async () => {
        setLoadingCategories(true);
        try {
          const snapshot = await getDocs(collection(db, "categories"));
          const list: ICategory[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ICategory, "id">),
          }));
          setCategories(list);
          if (list.length > 0 && !categoryId) {
            setCategoryId(list[0].name || list[0].id || "");
          }
        } catch (err) {
          console.warn("Fetch categories error:", err);
          setCategories([
            { id: "cat-1", name: "العناية بالبشرة", parentId: null, slug: "skincare", productCount: 10, sortOrder: 1, isActive: true },
            { id: "cat-2", name: "المكملات الغذائية", parentId: null, slug: "supplements", productCount: 5, sortOrder: 2, isActive: true },
            { id: "cat-3", name: "العطور", parentId: null, slug: "perfumes", productCount: 8, sortOrder: 3, isActive: true },
          ]);
          setCategoryId("العناية بالبشرة");
        } finally {
          setLoadingCategories(false);
        }
      };

      const fetchAvailableProducts = async () => {
        try {
          const q = query(collection(db, "products"), where("type", "==", "product"));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const list: IProduct[] = snapshot.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<IProduct, "id">),
            }));
            setAvailableProducts(list);
          } else {
            setAvailableProducts([
              { id: "p-1", title: "سيروم فيتامين سي للوجه 50ml", type: "product", categoryId: "العناية بالبشرة", price: 4500, compareAtPrice: 6000 },
              { id: "p-2", title: "كريم الترطيب الهيدروليكي 100ml", type: "product", categoryId: "العناية بالبشرة", price: 3200, compareAtPrice: 4000 },
              { id: "p-3", title: "عطر اللافندر والمسك 100ml", type: "product", categoryId: "العطور", price: 8500, compareAtPrice: 9900 },
              { id: "p-4", title: "غسول البشرة اللطيف 150ml", type: "product", categoryId: "العناية بالبشرة", price: 2100, compareAtPrice: 2800 },
            ]);
          }
        } catch (err) {
          console.warn("Fetch available single products error:", err);
          setAvailableProducts([
            { id: "p-1", title: "سيروم فيتامين سي للوجه 50ml", type: "product", categoryId: "العناية بالبشرة", price: 4500, compareAtPrice: 6000 },
            { id: "p-2", title: "كريم الترطيب الهيدروليكي 100ml", type: "product", categoryId: "العناية بالبشرة", price: 3200, compareAtPrice: 4000 },
            { id: "p-3", title: "عطر اللافندر والمسك 100ml", type: "product", categoryId: "العطور", price: 8500, compareAtPrice: 9900 },
          ]);
        }
      };

      fetchCategories();
      fetchAvailableProducts();

      if (productToEdit) {
        setProductType(productToEdit.type || "product");
        setTitle(productToEdit.title || productToEdit.name || "");
        setCategoryId(productToEdit.categoryId || productToEdit.category || "");
        setPrice(productToEdit.price || 0);
        setCompareAtPrice(productToEdit.compareAtPrice ?? productToEdit.oldPrice ?? null);
        setShortDescription(productToEdit.shortDescription || "");
        setDescription(productToEdit.description || "");
        
        // Handle images array conversion to IProductImage[]
        if (productToEdit.images && productToEdit.images.length > 0) {
          if (typeof productToEdit.images[0] === "string") {
            const converted: IProductImage[] = (productToEdit.images as unknown as string[]).map((url, idx) => ({
              url,
              isMain: idx === 0,
            }));
            setImages(converted);
          } else {
            setImages(productToEdit.images as IProductImage[]);
          }
        } else {
          setImages([]);
        }

        setIsActive(productToEdit.isActive ?? true);
        setIsFreeShipping(productToEdit.isFreeShipping ?? false);
        setIsFeatured(productToEdit.isFeatured ?? false);
        setRating(productToEdit.rating ?? 4.9);
        setBundleItems(
          productToEdit.bundleItems && productToEdit.bundleItems.length > 0
            ? productToEdit.bundleItems
            : []
        );
      } else {
        setProductType("product");
        setTitle("");
        setPrice(0);
        setCompareAtPrice(null);
        setShortDescription("");
        setDescription("");
        setImages([]);
        setIsActive(true);
        setIsFreeShipping(false);
        setIsFeatured(false);
        setRating(4.9);
        setBundleItems([]);
      }
      setError(null);
    }
  }, [isOpen, productToEdit]);

  if (!isOpen) return null;

  // Cloudinary Multi-Image Upload Handler
  const handleCloudinaryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setError(null);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo";
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "lina_store_preset";

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const imageUrl = data.secure_url || data.url;

          setImages((prev) => {
            const isFirst = prev.length === 0;
            return [...prev, { url: imageUrl, isMain: isFirst }];
          });
        } else {
          const fallbackUrl = URL.createObjectURL(file);
          setImages((prev) => {
            const isFirst = prev.length === 0;
            return [...prev, { url: fallbackUrl, isMain: isFirst }];
          });
        }
      } catch (err) {
        console.warn("Cloudinary upload network fallback:", err);
        const fallbackUrl = URL.createObjectURL(file);
        setImages((prev) => {
          const isFirst = prev.length === 0;
          return [...prev, { url: fallbackUrl, isMain: isFirst }];
        });
      }
    }

    setUploadingImage(false);
  };

  // Set image as main thumbnail
  const handleSetMainImage = (targetIndex: number) => {
    setImages((prev) =>
      prev.map((img, idx) => ({
        ...img,
        isMain: idx === targetIndex,
      }))
    );
  };

  // Remove image
  const handleRemoveImage = (targetIndex: number) => {
    const imgToRemove = images[targetIndex];
    if (imgToRemove && imgToRemove.url) {
      setRemovedImages((prev) => [...prev, imgToRemove.url]);
    }

    setImages((prev) => {
      const filtered = prev.filter((_, idx) => idx !== targetIndex);
      if (filtered.length > 0 && !filtered.some((img) => img.isMain)) {
        filtered[0].isMain = true;
      }
      return filtered;
    });
  };

  // Smart Autocomplete Product Selection for Bundle (Increments quantity on existing item selection)
  const handleSelectProductForBundle = (selectedProd: IProduct) => {
    const prodTitle = selectedProd.title || selectedProd.name || "منتج مفرد";
    let mainImgUrl = "";
    if (selectedProd.images && selectedProd.images.length > 0) {
      const first = selectedProd.images[0];
      if (typeof first === "string") {
        mainImgUrl = first;
      } else {
        const imgList = selectedProd.images as IProductImage[];
        mainImgUrl = imgList.find((i) => i.isMain)?.url || imgList[0].url;
      }
    }

    setBundleItems((prev) => {
      const cleaned = prev.filter((item) => item.title.trim() !== "");
      const existingIndex = cleaned.findIndex(
        (item) => (selectedProd.id && item.productId === selectedProd.id) || item.title === prodTitle
      );

      if (existingIndex >= 0) {
        const updated = [...cleaned];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      } else {
        return [
          ...cleaned,
          {
            productId: selectedProd.id,
            title: prodTitle,
            image: mainImgUrl,
            quantity: 1,
          },
        ];
      }
    });

    setBundleSearchQuery("");
    setIsSearchFocused(false);
  };

  const handleRemoveBundleItem = (index: number) => {
    setBundleItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBundleItemChange = (index: number, field: "title" | "image" | "quantity", val: any) => {
    setBundleItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  // Filtered Single Products by Search Query (Displays ALL products if query is empty)
  const filteredAvailableProducts = bundleSearchQuery.trim()
    ? availableProducts.filter((p) => {
        const titleText = (p.title || p.name || "").toLowerCase();
        const categoryText = (p.categoryId || p.category || "").toLowerCase();
        const queryText = bundleSearchQuery.toLowerCase().trim();
        return titleText.includes(queryText) || categoryText.includes(queryText);
      })
    : availableProducts;

  // Validation Check
  const validBundleItems = bundleItems.filter((item) => item.title.trim() !== "");
  const isBundleInvalid = productType === "bundle" && validBundleItems.length === 0;

  // Calculate Discount Percentage
  const discountPercent =
    compareAtPrice && compareAtPrice > price && price > 0
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("عنوان المنتج مطلوب.");
      return;
    }

    if (isBundleInvalid) {
      setError("يجب إضافة عنصر واحد على الأقل داخل الباقة قبل حفظ البيانات.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const productPayload: Record<string, any> = {
      title: title.trim(),
      type: productType,
      categoryId: categoryId || "العناية بالبشرة",
      price: Number(price) || 0,
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      shortDescription: shortDescription.trim() || "",
      description: description.trim() || "",
      images: images || [],
      isActive: Boolean(isActive),
      isFreeShipping: Boolean(isFreeShipping),
      isFeatured: Boolean(isFeatured),
      rating: Number(rating) || 4.9,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (productType === "bundle") {
      productPayload.bundleItems = validBundleItems;
    }

    try {
      if (productToEdit?.id) {
        const prodRef = doc(db, "products", productToEdit.id);
        await updateDoc(prodRef, productPayload);
      } else {
        await addDoc(collection(db, "products"), productPayload);
      }

      if (removedImages.length > 0) {
        const deletePromises = removedImages.map((url) =>
          fetch("/api/cloudinary/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          }).catch((err) => console.warn("Failed to delete Cloudinary image:", url, err))
        );
        await Promise.all(deletePromises);
        setRemovedImages([]);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Error saving product to Firestore:", err);
      onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 select-none" dir="rtl">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Centered Large Modal Container */}
      <div className="relative z-10 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl bg-md-surface text-md-surface-on rounded-none sm:rounded-2xl shadow-2xl border border-md-outline/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-md-outline/10 bg-md-surface-container-low flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-md-full bg-md-primary-container text-md-primary-on-container">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {productToEdit ? "تعديل المنتج / الباقة" : "إضافة منتج أو باقة جديدة"}
              </h2>
              <p className="text-xs text-md-surface-on-variant">
                رفع الصور عبر Cloudinary وإدارة الأسعار بالدينار الجزائري (دج)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-md-surface-variant/30 text-md-surface-on-variant transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {error && (
            <div className="p-3.5 rounded-md-md bg-md-error-container text-md-error-on-container text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Toggle Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-md-surface-on-variant">نوع العنصر</label>
            <div className="grid grid-cols-2 gap-3 p-1.5 rounded-md-xl bg-md-surface-container-high border border-md-outline/10">
              <button
                type="button"
                onClick={() => setProductType("product")}
                className={`flex items-center justify-center gap-2 py-3 rounded-md-lg text-sm font-bold transition-all ${
                  productType === "product"
                    ? "bg-md-primary text-md-primary-on shadow-md-1"
                    : "text-md-surface-on-variant hover:text-md-surface-on"
                }`}
              >
                <Package className="w-4 h-4" />
                <span>منتج مفرد</span>
              </button>

              <button
                type="button"
                onClick={() => setProductType("bundle")}
                className={`flex items-center justify-center gap-2 py-3 rounded-md-lg text-sm font-bold transition-all ${
                  productType === "bundle"
                    ? "bg-md-tertiary text-md-tertiary-on shadow-md-1"
                    : "text-md-surface-on-variant hover:text-md-surface-on"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>باقة / مجموعة (Bundle)</span>
              </button>
            </div>
          </div>

          {/* Basic Fields & Dinar Currency */}
          <div className="space-y-4 p-5 rounded-md-xl bg-md-surface-container border border-md-outline/10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-md-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> التفاصيل والأسعار (دج)
              </h3>
              {discountPercent !== null && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                  خصم {discountPercent}%-
                </span>
              )}
            </div>

            {/* Title & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-md-surface-on">
                  {productType === "product" ? "اسم المنتج *" : "اسم الباقة / المجموعة *"}
                </label>
                <input
                  type="text"
                  placeholder={productType === "product" ? "مثال: سيروم فيتامين سي 50ml" : "مثال: مجموعة العناية الشاملة"}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-md-md bg-md-surface border border-md-outline/30 focus:border-md-primary text-sm outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-md-surface-on">الصنف / القسم *</label>
                {loadingCategories ? (
                  <div className="h-10 bg-md-surface-container-high rounded-md-md animate-pulse" />
                ) : (
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-md-md bg-md-surface border border-md-outline/30 focus:border-md-primary text-sm outline-none transition-all"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id || cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Prices in Dinar (دج) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-md-surface-on">
                  السعر الحالي (دج) *
                </label>
                <input
                  type="number"
                  step="1"
                  placeholder="0 دج"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-md-md bg-md-surface border border-md-outline/30 focus:border-md-primary text-sm outline-none transition-all font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-md-surface-on">
                  السعر القديم / المقارن (دج) (اختياري)
                </label>
                <input
                  type="number"
                  step="1"
                  placeholder="0 دج"
                  value={compareAtPrice ?? ""}
                  onChange={(e) => setCompareAtPrice(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-2.5 rounded-md-md bg-md-surface border border-md-outline/30 focus:border-md-primary text-sm outline-none transition-all font-mono"
                />
              </div>
            </div>

            {/* Short Description */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-md-surface-on">الوصف المختصر</label>
              <textarea
                rows={2}
                placeholder="نبذة سريعة تظهر في بطاقة المنتج..."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full px-4 py-2 rounded-md-md bg-md-surface border border-md-outline/30 focus:border-md-primary text-sm outline-none transition-all"
              />
            </div>
          </div>

          {/* Cloudinary Multi-Image Upload Area */}
          <div className="space-y-4 p-5 rounded-md-xl bg-md-surface-container border border-md-outline/10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-md-primary flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> صور المنتج (Cloudinary Multi-Image)
              </h3>
              <span className="text-xs text-md-surface-on-variant">{images.length} صورة مرفوعة</span>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div className="border-2 border-dashed border-md-outline/30 rounded-md-lg p-4 text-center bg-md-surface/50 hover:bg-md-surface transition-colors cursor-pointer relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleCloudinaryUpload}
                disabled={uploadingImage}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <div className="py-2 space-y-2 flex flex-col items-center">
                {uploadingImage ? (
                  <>
                    <Loader2 className="w-8 h-8 text-md-primary animate-spin" />
                    <p className="text-xs font-semibold text-md-primary">جاري رفع الصور عبر Cloudinary API...</p>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-md-primary" />
                    <p className="text-sm font-bold text-md-surface-on">اضغط لتحديد عدة صور من جهازك أو اسحبها هنا</p>
                    <p className="text-xs text-md-surface-on-variant">يتم رفع الصور مباشرة عبر Cloudinary REST API</p>
                  </>
                )}
              </div>
            </div>

            {/* Cloudinary Uploaded Thumbnails Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {images.map((imgObj, idx) => (
                  <div
                    key={idx}
                    className={`relative group rounded-md-md overflow-hidden border ${
                      imgObj.isMain ? "border-amber-400 ring-2 ring-amber-400/50" : "border-md-outline/20"
                    } bg-black/20 aspect-square`}
                  >
                    <img src={imgObj.url} alt={`Product Image ${idx + 1}`} className="w-full h-full object-cover" />

                    {/* Main Image Badge */}
                    {imgObj.isMain && (
                      <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px]">
                        الصورة الرئيسية
                      </span>
                    )}

                    {/* Thumbnail Action Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSetMainImage(idx)}
                        className={`p-1.5 rounded-full ${
                          imgObj.isMain
                            ? "bg-amber-400 text-slate-950"
                            : "bg-white/20 text-white hover:bg-amber-400 hover:text-slate-950"
                        } transition-colors`}
                        title="تعيين كصورة رئيسية"
                      >
                        <Star className={`w-4 h-4 ${imgObj.isMain ? "fill-current" : ""}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1.5 rounded-full bg-red-600/90 text-white hover:bg-red-600 transition-colors"
                        title="حذف الصورة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Bundle Items Section with Smart Search Autocomplete (Only for type === 'bundle') */}
          {productType === "bundle" && (
            <div className="space-y-4 p-5 rounded-md-xl bg-md-tertiary-container/20 border border-md-tertiary/30">
              <div>
                <h3 className="text-sm font-bold text-md-tertiary flex items-center gap-2">
                  <Layers className="w-4 h-4" /> مكونات الباقة (Bundle Items) *
                </h3>
                <p className="text-[11px] text-md-surface-on-variant mt-0.5">
                  اضغط على حقل البحث لإظهار جميع المنتجات المفردة واختيار المكونات
                </p>
              </div>

              {isBundleInvalid && (
                <div className="p-3 rounded-md-md bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>تنبيه: يجب إضافة عنصر واحد على الأقل داخل الباقة لتفعيل زر الحفظ.</span>
                </div>
              )}

              {/* Smart Search Autocomplete Input with Click Outside Ref */}
              <div className="relative" ref={searchContainerRef}>
                <label className="block text-xs font-semibold text-md-surface-on mb-1.5 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-md-primary" />
                  <span>البحث والفلترة في قائمة المنتجات المفردة (Autocomplete)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="اضغط لإظهار كل المنتجات أو اكتب للاختيار والفلترة..."
                    value={bundleSearchQuery}
                    onChange={(e) => {
                      setBundleSearchQuery(e.target.value);
                      setIsSearchFocused(true);
                    }}
                    onFocus={() => setIsSearchFocused(true)}
                    className="w-full px-4 py-2.5 rounded-md-lg bg-md-surface border border-md-outline/30 text-sm text-md-surface-on outline-none focus:border-md-primary transition-all"
                  />
                  {bundleSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setBundleSearchQuery("")}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-md-surface-on-variant hover:text-md-surface-on"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown List - Visible when focused */}
                {isSearchFocused && availableProducts.length > 0 && (
                  <div className="absolute z-30 w-full mt-1.5 max-h-60 overflow-y-auto bg-md-surface text-md-surface-on rounded-md-xl border border-md-outline/20 shadow-2xl divide-y divide-md-outline/10 animate-in fade-in zoom-in-95">
                    {filteredAvailableProducts.length === 0 ? (
                      <div className="p-4 text-center text-xs text-md-surface-on-variant font-medium">
                        لم يتم العثور على منتجات مفردة مطابقة لـ &quot;{bundleSearchQuery}&quot;
                      </div>
                    ) : (
                      filteredAvailableProducts.map((prod) => {
                        let mainImgUrl: string | null = null;
                        if (prod.images && prod.images.length > 0) {
                          const first = prod.images[0];
                          if (typeof first === "string") {
                            mainImgUrl = first;
                          } else {
                            const imgList = prod.images as IProductImage[];
                            mainImgUrl = imgList.find((i) => i.isMain)?.url || imgList[0].url;
                          }
                        }

                        return (
                          <button
                            key={prod.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevents blur before click handler completes
                              handleSelectProductForBundle(prod);
                            }}
                            className="w-full p-3 flex items-center justify-between gap-3 text-right hover:bg-md-surface-container-high transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-md-md overflow-hidden bg-md-surface-container border border-md-outline/10 shrink-0 flex items-center justify-center">
                                {mainImgUrl ? (
                                  <img src={mainImgUrl} alt={prod.title} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-4 h-4 text-md-primary" />
                                )}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-md-surface-on">{prod.title || prod.name}</h4>
                                <span className="text-[10px] text-md-surface-on-variant">{prod.categoryId || prod.category}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-md-primary">{formatCurrency(prod.price)}</span>
                              <Plus className="w-4 h-4 text-md-primary shrink-0" />
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Selected Bundle Items Cards */}
              <div className="space-y-2.5 pt-2">
                {bundleItems.length === 0 ? (
                  <div className="p-4 rounded-md-lg bg-md-surface/50 border border-dashed border-md-outline/20 text-center text-xs text-md-surface-on-variant">
                    لا توجد عناصر مضافة بعد. اضغط حقل البحث أعلاه لإظهار المنتجات المفردة واختيار مكونات الباقة.
                  </div>
                ) : (
                  bundleItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-md-xl bg-md-surface border border-md-outline/20 flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-md-md overflow-hidden bg-md-surface-container border border-md-outline/10 shrink-0 flex items-center justify-center">
                          {item.image ? (
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-md-tertiary" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-md-surface-on truncate">{item.title}</h4>
                          <span className="text-[10px] text-md-surface-on-variant">عنصر داخل الباقة</span>
                        </div>
                      </div>

                      {/* Quantity Counter */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1 bg-md-surface-container px-2 py-1 rounded-md-full border border-md-outline/20">
                          <button
                            type="button"
                            onClick={() => handleBundleItemChange(idx, "quantity", Math.max(1, item.quantity - 1))}
                            className="p-1 rounded-full hover:bg-md-surface-variant/30 text-md-surface-on-variant"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-bold w-5 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleBundleItemChange(idx, "quantity", item.quantity + 1)}
                            className="p-1 rounded-full hover:bg-md-surface-variant/30 text-md-surface-on-variant"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveBundleItem(idx)}
                          className="p-1.5 text-md-error hover:bg-md-error-container/30 rounded-full transition-colors"
                          title="حذف من الباقة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Description (Rich Text Editor Tiptap) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-md-surface-on-variant">وصف التفاصيل (Rich Text Editor)</label>
            <RichTextEditor
              content={description}
              onChange={(html) => setDescription(html)}
            />
          </div>

          {/* Switches Group: Active, Free Shipping, Featured & Star Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Active Status Switch */}
            <div className="flex items-center justify-between p-4 rounded-md-xl bg-md-surface-container border border-md-outline/10">
              <span className="text-xs font-bold text-md-surface-on">تفعيل العرض</span>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                  isActive ? "bg-md-primary" : "bg-md-outline/30"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    isActive ? "-translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Free Shipping Switch */}
            <div className="flex items-center justify-between p-4 rounded-md-xl bg-md-surface-container border border-md-outline/10">
              <div>
                <span className="text-xs font-bold text-md-surface-on block">توصيل مجاني</span>
                <span className="text-[10px] text-md-surface-on-variant">إلغاء رسوم الشحن</span>
              </div>
              <button
                type="button"
                onClick={() => setIsFreeShipping(!isFreeShipping)}
                className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                  isFreeShipping ? "bg-emerald-500" : "bg-md-outline/30"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    isFreeShipping ? "-translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Featured Product Switch */}
            <div className="flex items-center justify-between p-4 rounded-md-xl bg-md-surface-container border border-md-outline/10">
              <div>
                <span className="text-xs font-bold text-md-surface-on block">منتج مميز ⭐</span>
                <span className="text-[10px] text-md-surface-on-variant">يظهر بالرئيسية</span>
              </div>
              <button
                type="button"
                onClick={() => setIsFeatured(!isFeatured)}
                className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                  isFeatured ? "bg-amber-500" : "bg-md-outline/30"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    isFeatured ? "-translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Rating Control Input */}
          <div className="p-4 rounded-md-xl bg-md-surface-container border border-md-outline/10">
            <label className="block text-xs font-bold text-md-surface-on mb-1.5 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 fill-current" />
              <span>تقييم النجوم (Manual Admin Rating Control, e.g. 4.9)</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="5"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full sm:w-48 px-4 py-2 rounded-md-md bg-md-surface border border-md-outline/30 text-sm outline-none font-mono font-bold"
            />
          </div>

          {/* Modal Footer Submit Actions */}
          <div className="pt-4 border-t border-md-outline/10 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-md-full text-sm font-semibold text-md-surface-on-variant hover:bg-md-surface-variant/20 transition-colors"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={submitting || isBundleInvalid}
              className="px-6 py-2.5 rounded-md-full bg-md-primary text-md-primary-on text-sm font-bold shadow-md-1 hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الحفظ في Firestore...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{productToEdit ? "حفظ التعديلات" : "حفظ المنتج/الباقة"}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
