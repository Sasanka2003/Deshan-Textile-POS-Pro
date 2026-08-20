import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import Barcode from 'react-barcode'

import {
  Barcode as BarcodeIcon,
  Check,
  Copy,
  Minus,
  PackageSearch,
  Plus,
  Printer,
  Search,
  Tags,
} from 'lucide-react'

import AppLayout from '../../layouts/AppLayout'
import { useAuth } from '../../contexts/AuthContext'

import {
  getProducts,
  saveProductBarcode,
} from '../../services/productService'

import type {
  Product,
} from '../../types/product'

import '../../styles/barcode-generator.css'

type LabelSize =
  | '40x25'
  | '50x30'

type PriceMode =
  | 'retail'
  | 'wholesale'

function money(value: number) {
  return `Rs. ${value.toLocaleString(
    'en-LK',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`
}

function generateBarcodeValue() {
  const now =
    Date.now()
      .toString()
      .slice(-9)

  const random =
    Math.floor(
      100 + Math.random() * 900,
    )

  return `${now}${random}`
}

function escapeHtml(
  value:
    | string
    | null
    | undefined,
) {
  if (!value) {
    return ''
  }

  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export default function BarcodeGeneratorPage() {
  const { staff } = useAuth()

  const businessId =
    staff?.businessId

  const [
    products,
    setProducts,
  ] = useState<Product[]>([])

  const [
    selectedProductId,
    setSelectedProductId,
  ] = useState('')

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    customBarcode,
    setCustomBarcode,
  ] = useState('')

  const [
    quantity,
    setQuantity,
  ] = useState(1)

  const [
    labelSize,
    setLabelSize,
  ] =
    useState<LabelSize>('40x25')

  const [
    priceMode,
    setPriceMode,
  ] =
    useState<PriceMode>('retail')

  const [
    showPrice,
    setShowPrice,
  ] = useState(true)

  const [
    showSku,
    setShowSku,
  ] = useState(true)

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    savingBarcode,
    setSavingBarcode,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

  const [
    success,
    setSuccess,
  ] = useState('')

  async function loadProducts() {
    if (!businessId) {
      setProducts([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const data =
        await getProducts(
          businessId,
        )

      setProducts(
        data.filter(
          (product) =>
            product.isActive,
        ),
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load products.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProducts()
  }, [businessId])

  const selectedProduct =
    useMemo(
      () =>
        products.find(
          (product) =>
            product.id ===
            selectedProductId,
        ) ?? null,
      [
        products,
        selectedProductId,
      ],
    )

  useEffect(() => {
    if (!selectedProduct) {
      setCustomBarcode('')
      return
    }

    setCustomBarcode(
      selectedProduct.barcode ??
        '',
    )

    setError('')
    setSuccess('')
  }, [selectedProduct])

  const filteredProducts =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      if (!query) {
        return products
      }

      return products.filter(
        (product) =>
          [
            product.name,
            product.sku,
            product.barcode,
            product.colour,
            product.size,
            product.categoryName,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(query),
            ),
      )
    }, [
      products,
      search,
    ])

  const barcodeValue =
    customBarcode.trim()

  const barcodeIsSaved =
    Boolean(
      selectedProduct &&
        barcodeValue &&
        selectedProduct.barcode ===
          barcodeValue,
    )

  const selectedPrice =
    selectedProduct
      ? priceMode === 'retail'
        ? selectedProduct.retailPrice
        : selectedProduct.wholesalePrice
      : 0

  function handleGenerateBarcode() {
    if (!selectedProduct) {
      setError(
        'Select a product first.',
      )
      return
    }

    const value =
      generateBarcodeValue()

    setCustomBarcode(value)

    setSuccess(
      `Barcode ${value} generated. Save it before printing.`,
    )

    setError('')
  }

  async function handleSaveBarcode() {
    if (!businessId) {
      setError(
        'Business information is unavailable.',
      )
      return
    }

    if (!selectedProduct) {
      setError(
        'Select a product first.',
      )
      return
    }

    if (!barcodeValue) {
      setError(
        'Generate or enter a barcode first.',
      )
      return
    }

    try {
      setSavingBarcode(true)

      setError('')
      setSuccess('')

      const savedBarcode =
        await saveProductBarcode(
          selectedProduct.id,
          businessId,
          barcodeValue,
        )

      setProducts(
        (current) =>
          current.map(
            (product) =>
              product.id ===
              selectedProduct.id
                ? {
                    ...product,
                    barcode:
                      savedBarcode,
                  }
                : product,
          ),
      )

      setCustomBarcode(
        savedBarcode,
      )

      setSuccess(
        `Barcode ${savedBarcode} saved to ${selectedProduct.name}.`,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save barcode.',
      )
    } finally {
      setSavingBarcode(false)
    }
  }

  async function copyBarcode() {
    if (!barcodeValue) {
      setError(
        'Generate or enter a barcode first.',
      )
      return
    }

    try {
      await navigator.clipboard.writeText(
        barcodeValue,
      )

      setSuccess(
        'Barcode copied.',
      )

      setError('')
    } catch {
      setError(
        'Unable to copy barcode.',
      )
    }
  }

  function updateQuantity(
    value: number,
  ) {
    const safeValue =
      Math.min(
        500,
        Math.max(
          1,
          Math.floor(
            value || 1,
          ),
        ),
      )

    setQuantity(
      safeValue,
    )
  }

  function printLabels() {
    if (!selectedProduct) {
      setError(
        'Select a product first.',
      )
      return
    }

    if (!barcodeValue) {
      setError(
        'Barcode is required before printing.',
      )
      return
    }

    if (!barcodeIsSaved) {
      setError(
        'Save the barcode to the product before printing labels.',
      )
      return
    }

    const labelWidth =
      labelSize === '40x25'
        ? '40mm'
        : '50mm'

    const labelHeight =
      labelSize === '40x25'
        ? '25mm'
        : '30mm'

    const productName =
      escapeHtml(
        selectedProduct.name,
      )

    const sku =
      escapeHtml(
        selectedProduct.sku,
      )

    const colour =
      escapeHtml(
        selectedProduct.colour,
      )

    const size =
      escapeHtml(
        selectedProduct.size,
      )

    const printWindow =
      window.open(
        '',
        '_blank',
        'width=700,height=700',
      )

    if (!printWindow) {
      setError(
        'Unable to open print window. Please allow pop-ups.',
      )
      return
    }

    const labelHtml =
      Array.from(
        {
          length: quantity,
        },
      )
        .map(
          (_, index) => `
            <div class="label">
              <div class="product-name">
                ${productName}
              </div>

              ${
                colour || size
                  ? `
                    <div class="variant">
                      ${
                        colour
                          ? colour
                          : ''
                      }

                      ${
                        colour &&
                        size
                          ? ' / '
                          : ''
                      }

                      ${
                        size
                          ? size
                          : ''
                      }
                    </div>
                  `
                  : ''
              }

              <svg
                class="barcode-svg"
                id="barcode-${index}"
              ></svg>

              ${
                showSku &&
                sku
                  ? `
                    <div class="sku">
                      SKU:
                      ${sku}
                    </div>
                  `
                  : ''
              }

              ${
                showPrice
                  ? `
                    <div class="price">
                      ${money(
                        selectedPrice,
                      )}
                    </div>
                  `
                  : ''
              }
            </div>
          `,
        )
        .join('')

    printWindow.document.write(`
      <!doctype html>

      <html>
        <head>
          <meta charset="UTF-8" />

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          />

          <title>
            Barcode Labels
          </title>

          <style>
            @page {
              size:
                ${labelWidth}
                ${labelHeight};

              margin: 0;
            }

            * {
              box-sizing:
                border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;

              background: #fff;

              font-family:
                Arial,
                Helvetica,
                sans-serif;
            }

            .labels {
              display: flex;
              flex-wrap: wrap;

              align-items:
                flex-start;

              justify-content:
                flex-start;
            }

            .label {
              width:
                ${labelWidth};

              height:
                ${labelHeight};

              display: flex;

              flex-direction:
                column;

              align-items:
                center;

              justify-content:
                center;

              overflow: hidden;

              padding:
                1.5mm;

              background: #fff;

              color: #000;

              page-break-after:
                always;

              break-after:
                page;
            }

            .product-name {
              width: 100%;

              overflow: hidden;

              text-align:
                center;

              text-overflow:
                ellipsis;

              white-space:
                nowrap;

              font-size:
                ${
                  labelSize ===
                  '40x25'
                    ? '8px'
                    : '9px'
                };

              font-weight:
                700;
            }

            .variant {
              margin-top:
                0.4mm;

              font-size:
                6.5px;

              line-height:
                1;
            }

            .barcode-svg {
              display: block;

              width: 100%;

              max-height:
                ${
                  labelSize ===
                  '40x25'
                    ? '10mm'
                    : '12mm'
                };

              margin:
                0.7mm
                auto
                0;
            }

            .sku {
              margin-top:
                0.2mm;

              font-size:
                6px;
            }

            .price {
              margin-top:
                0.3mm;

              font-size:
                ${
                  labelSize ===
                  '40x25'
                    ? '8px'
                    : '9px'
                };

              font-weight:
                800;
            }

            @media print {
              html,
              body {
                width:
                  ${labelWidth};

                margin: 0 !important;

                padding: 0 !important;
              }
            }
          </style>

          <script
            src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"
          ></script>
        </head>

        <body>

          <div class="labels">
            ${labelHtml}
          </div>

          <script>
            window.addEventListener(
              'load',
              function () {
                for (
                  let i = 0;
                  i < ${quantity};
                  i++
                ) {
                  JsBarcode(
                    '#barcode-' + i,
                    ${JSON.stringify(
                      barcodeValue,
                    )},
                    {
                      format:
                        'CODE128',

                      displayValue:
                        true,

                      fontSize:
                        7,

                      height:
                        ${
                          labelSize ===
                          '40x25'
                            ? 24
                            : 30
                        },

                      width:
                        1.2,

                      margin:
                        0
                    }
                  );
                }

                setTimeout(
                  function () {
                    window.focus();
                    window.print();
                  },
                  400
                );
              }
            );

            window.addEventListener(
              'afterprint',
              function () {
                window.close();
              }
            );
          </script>

        </body>
      </html>
    `)

    printWindow.document.close()
  }

  return (
    <AppLayout>
      <div className="barcode-page">

        <section className="barcode-page-heading">

          <div>
            <h1>
              Barcode Labels
            </h1>

            <p>
              Generate, save and print
              product barcode labels for
              POS scanning.
            </p>
          </div>

          <div className="barcode-page-badge">

            <BarcodeIcon
              size={18}
            />

            Code 128

          </div>

        </section>

        {error && (
          <div className="barcode-message error">
            {error}
          </div>
        )}

        {success && (
          <div className="barcode-message success">

            <Check
              size={17}
            />

            {success}

          </div>
        )}

        <div className="barcode-workspace">

          <section className="barcode-product-panel">

            <div className="barcode-card-heading">

              <div>
                <h2>
                  Products
                </h2>

                <p>
                  Select a product to
                  create labels.
                </p>
              </div>

              <PackageSearch
                size={19}
              />

            </div>

            <div className="barcode-product-search">

              <Search
                size={17}
              />

              <input
                value={
                  search
                }
                onChange={(event) =>
                  setSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Search product, SKU, barcode..."
              />

            </div>

            <div className="barcode-product-list">

              {loading ? (

                <div className="barcode-empty">
                  Loading products...
                </div>

              ) : filteredProducts.length ===
                0 ? (

                <div className="barcode-empty">
                  No products found.
                </div>

              ) : (

                filteredProducts.map(
                  (product) => (

                    <button
                      type="button"
                      key={
                        product.id
                      }
                      className={
                        selectedProductId ===
                        product.id
                          ? 'barcode-product-item active'
                          : 'barcode-product-item'
                      }
                      onClick={() =>
                        setSelectedProductId(
                          product.id,
                        )
                      }
                    >

                      <div>

                        <strong>
                          {
                            product.name
                          }
                        </strong>

                        <span>
                          {product.sku ??
                            'No SKU'}
                        </span>

                        <small>
                          {product.barcode ??
                            'No barcode'}
                        </small>

                      </div>

                      <strong className="barcode-product-price">
                        {money(
                          product.retailPrice,
                        )}
                      </strong>

                    </button>

                  ),
                )

              )}

            </div>

          </section>

          <section className="barcode-preview-card">

            <div className="barcode-card-heading">

              <div>
                <h2>
                  Label Preview
                </h2>

                <p>
                  Preview the selected
                  product label.
                </p>
              </div>

              <Tags
                size={19}
              />

            </div>

            {!selectedProduct ? (

              <div className="barcode-preview-empty">

                <BarcodeIcon
                  size={46}
                />

                <strong>
                  Select a product
                </strong>

                <span>
                  Product label preview
                  will appear here.
                </span>

              </div>

            ) : (

              <div className="barcode-preview-area">

                <div
                  className={`barcode-label-preview ${labelSize}`}
                >

                  <div className="barcode-label-name">
                    {
                      selectedProduct.name
                    }
                  </div>

                  {(selectedProduct.colour ||
                    selectedProduct.size) && (

                    <div className="barcode-label-variant">

                      {selectedProduct.colour}

                      {selectedProduct.colour &&
                      selectedProduct.size
                        ? ' / '
                        : ''}

                      {selectedProduct.size}

                    </div>

                  )}

                  {barcodeValue ? (

                    <Barcode
                      value={
                        barcodeValue
                      }
                      format="CODE128"
                      width={1.4}
                      height={
                        labelSize ===
                        '40x25'
                          ? 38
                          : 48
                      }
                      fontSize={10}
                      margin={0}
                      displayValue
                    />

                  ) : (

                    <div className="barcode-no-code">
                      Generate or enter a
                      barcode
                    </div>

                  )}

                  {showSku &&
                    selectedProduct.sku && (

                    <div className="barcode-label-sku">
                      SKU:{' '}
                      {
                        selectedProduct.sku
                      }
                    </div>

                  )}

                  {showPrice && (

                    <div className="barcode-label-price">
                      {money(
                        selectedPrice,
                      )}
                    </div>

                  )}

                </div>

                <div className="barcode-preview-meta">

                  <div>
                    <span>
                      Product
                    </span>

                    <strong>
                      {
                        selectedProduct.name
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Unit
                    </span>

                    <strong>
                      {
                        selectedProduct.unit
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Retail
                    </span>

                    <strong>
                      {money(
                        selectedProduct.retailPrice,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Wholesale
                    </span>

                    <strong>
                      {money(
                        selectedProduct.wholesalePrice,
                      )}
                    </strong>
                  </div>

                </div>

              </div>

            )}

          </section>

          <aside className="barcode-settings-card">

            <div className="barcode-card-heading">

              <div>
                <h2>
                  Label Settings
                </h2>

                <p>
                  Barcode and print
                  options.
                </p>
              </div>

            </div>

            <div className="barcode-settings">

              <label>
                Barcode

                <div className="barcode-input-action">

                  <input
                    value={
                      customBarcode
                    }
                    onChange={(event) => {
                      setCustomBarcode(
                        event.target.value
                          .replace(
                            /\s/g,
                            '',
                          ),
                      )

                      setSuccess('')
                      setError('')
                    }}
                    placeholder="Barcode number"
                    disabled={
                      !selectedProduct ||
                      savingBarcode
                    }
                  />

                  <button
                    type="button"
                    title="Copy barcode"
                    onClick={() =>
                      void copyBarcode()
                    }
                    disabled={
                      !barcodeValue
                    }
                  >
                    <Copy
                      size={16}
                    />
                  </button>

                </div>

              </label>

              <button
                type="button"
                className="barcode-generate-button"
                onClick={
                  handleGenerateBarcode
                }
                disabled={
                  !selectedProduct ||
                  savingBarcode
                }
              >
                <BarcodeIcon
                  size={17}
                />

                Generate Barcode
              </button>

              <button
                type="button"
                className="barcode-save-button"
                onClick={() =>
                  void handleSaveBarcode()
                }
                disabled={
                  !selectedProduct ||
                  !barcodeValue ||
                  barcodeIsSaved ||
                  savingBarcode
                }
              >
                <Check
                  size={17}
                />

                {savingBarcode
                  ? 'Saving...'
                  : barcodeIsSaved
                    ? 'Barcode Saved'
                    : 'Save Barcode'}
              </button>

              <label>
                Price Type

                <select
                  value={
                    priceMode
                  }
                  onChange={(event) =>
                    setPriceMode(
                      event.target
                        .value as PriceMode,
                    )
                  }
                >
                  <option value="retail">
                    Retail Price
                  </option>

                  <option value="wholesale">
                    Wholesale Price
                  </option>
                </select>

              </label>

              <label>
                Label Size

                <select
                  value={
                    labelSize
                  }
                  onChange={(event) =>
                    setLabelSize(
                      event.target
                        .value as LabelSize,
                    )
                  }
                >
                  <option value="40x25">
                    40 × 25 mm
                  </option>

                  <option value="50x30">
                    50 × 30 mm
                  </option>
                </select>

              </label>

              <div className="barcode-quantity-group">

                <span>
                  Label Quantity
                </span>

                <div className="barcode-quantity-control">

                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(
                        quantity - 1,
                      )
                    }
                    disabled={
                      quantity <= 1
                    }
                  >
                    <Minus
                      size={15}
                    />
                  </button>

                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={
                      quantity
                    }
                    onChange={(event) =>
                      updateQuantity(
                        Number(
                          event.target
                            .value,
                        ),
                      )
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(
                        quantity + 1,
                      )
                    }
                    disabled={
                      quantity >= 500
                    }
                  >
                    <Plus
                      size={15}
                    />
                  </button>

                </div>

              </div>

              <label className="barcode-checkbox-row">

                <input
                  type="checkbox"
                  checked={
                    showPrice
                  }
                  onChange={(event) =>
                    setShowPrice(
                      event.target
                        .checked,
                    )
                  }
                />

                Show price on label

              </label>

              <label className="barcode-checkbox-row">

                <input
                  type="checkbox"
                  checked={
                    showSku
                  }
                  onChange={(event) =>
                    setShowSku(
                      event.target
                        .checked,
                    )
                  }
                />

                Show SKU on label

              </label>

              <div className="barcode-print-summary">

                <span>
                  Labels to Print
                </span>

                <strong>
                  {quantity}
                </strong>

                <small>
                  {labelSize ===
                  '40x25'
                    ? '40 × 25 mm'
                    : '50 × 30 mm'}
                </small>

                <small>
                  {barcodeIsSaved
                    ? 'Barcode linked to product'
                    : 'Save barcode before printing'}
                </small>

              </div>

              <button
                type="button"
                className="barcode-print-button"
                onClick={
                  printLabels
                }
                disabled={
                  !selectedProduct ||
                  !barcodeValue ||
                  !barcodeIsSaved ||
                  savingBarcode
                }
              >

                <Printer
                  size={18}
                />

                {barcodeIsSaved
                  ? 'Print Labels'
                  : 'Save Barcode First'}

              </button>

            </div>

          </aside>

        </div>

      </div>
    </AppLayout>
  )
}