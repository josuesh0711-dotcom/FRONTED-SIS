document.addEventListener("DOMContentLoaded", function () {
    let productos = [];
    let codigoEditando = null;

    const formulario = document.getElementById("formProducto");
    const tabla = document.getElementById("tablaProductos");
    const btnGuardar = document.getElementById("btnGuardar");
    const formTitulo = document.getElementById("formTitulo");
    const totalGeneral = document.getElementById("totalGeneral");
    const alerta = document.getElementById("alertaMensaje");
    
    const API_URL = "https://backend-sistema-production.up.railway.app/api/productos";

    window.mostrarProductos = async function () {
        if (!tabla) return;

        try {
            const respuesta = await fetch(API_URL);
            if (!respuesta.ok) throw new Error("Error al obtener los productos");
            
            productos = await respuesta.json();
            renderizarTabla(productos);
            calcularTotalInventario();
        } catch (error) {
            console.error("Error:", error);
            mostrarAlerta("No se pudo conectar con el servidor backend.", "danger");
        }
    };

    // Función auxiliar para pintar la tabla y mostrar la Marca
    function renderizarTabla(listaProductos) {
        if (!tabla) return;
        tabla.innerHTML = "";

        if (!listaProductos || listaProductos.length === 0) {
            tabla.innerHTML = `<tr><td colspan="11" class="text-center text-muted">No se encontraron productos</td></tr>`;
            return;
        }

        listaProductos.forEach(p => {
            const valorTotal = (Number(p.precio) || 0) * (Number(p.cantidad) || 0);
            const estado = p.cantidad > 0 
                ? `<span class="badge bg-success">Disponible</span>` 
                : `<span class="badge bg-danger">Agotado</span>`;

            const fila = `
                <tr>
                    <td><strong>${p.id}</strong></td>
                    <td><strong>${p.codigo}</strong></td>
                    <td>${p.nombre}</td>
                    <td>${p.marca || 'N/A'}</td>
                    <td>${p.categoria}</td>
                    <td>${p.proveedor}</td>
                    <td>$${Number(p.precio).toLocaleString()}</td>
                    <td>${p.cantidad}</td>
                    <td>${estado}</td>
                    <td class="fw-bold">$${valorTotal.toLocaleString()}</td>
                    <td>
                        <button class="btn btn-warning btn-sm me-1" onclick="iniciarEdicion('${p.codigo}')">Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="eliminarProducto('${p.id}')">Eliminar</button>
                    </td>
                </tr>
            `;
            tabla.innerHTML += fila;
        });
    }

    function calcularTotalInventario() {
        const total = productos.reduce((acumulado, prod) => {
            const precio = Number(prod.precio) || 0;
            const cantidad = Number(prod.cantidad) || 0;
            return acumulado + (precio * cantidad);
        }, 0);

        if (totalGeneral) {
            totalGeneral.textContent = `Valor Total del Inventario: $${total.toLocaleString()}`;
        }

        let totalProductos = productos.length;
        let productosConStock = productos.filter(p => Number(p.cantidad) > 0).length;

        const lblTotal = document.getElementById('cardTotalProductos');
        const lblStock = document.getElementById('cardStockDisponibles');
        const lblValor = document.getElementById('cardValorInventario');

        if (lblTotal) lblTotal.textContent = totalProductos;
        if (lblStock) lblStock.textContent = productosConStock;
        if (lblValor) lblValor.textContent = `$${total.toLocaleString()}`;
    }

    if (formulario) {
        formulario.addEventListener("submit", async function (e) {
            e.preventDefault();

            const codigo = document.getElementById("codigo").value.trim();
            const nombre = document.getElementById("nombre").value.trim();
            const marca = document.getElementById("marca") ? document.getElementById("marca").value.trim() : "";
            const categoria = document.getElementById("categoria").value;
            const proveedor = document.getElementById("proveedor").value.trim();
            const precio = Number(document.getElementById("precio").value);
            const cantidad = Number(document.getElementById("cantidad").value);

            if (precio <= 0 || cantidad < 0) {
                mostrarAlerta("Valores no válidos en precio o cantidad.", "danger");
                return;
            }

            const productoData = { codigo, nombre, marca, categoria, proveedor, precio, cantidad };

            try {
                if (codigoEditando === null) {
                    const respuesta = await fetch(API_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(productoData)
                    });

                    if (!respuesta.ok) throw new Error("No se pudo registrar el producto");
                    mostrarAlerta("Producto registrado con éxito.", "success");
                } else {
                    const prodEncontrado = productos.find(p => p.codigo === codigoEditando);
                    if (!prodEncontrado) throw new Error("Producto no encontrado para editar");

                    const respuesta = await fetch(`${API_URL}/${prodEncontrado.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(productoData)
                    });

                    if (!respuesta.ok) throw new Error("No se pudo actualizar el producto");
                    mostrarAlerta("Producto actualizado correctamente.", "info");
                    cancelarEdicion();
                }

                mostrarProductos();
                formulario.reset();
            } catch (error) {
                console.error("Error en la operación:", error);
                mostrarAlerta("Ocurrió un error al guardar en el servidor.", "danger");
            }
        });
    }

    window.iniciarEdicion = function (codigo) {
        const prod = productos.find(p => p.codigo === codigo);
        if (!prod) return;

        codigoEditando = codigo;
        document.getElementById("codigo").value = prod.codigo;
        document.getElementById("codigo").disabled = true;
        document.getElementById("nombre").value = prod.nombre;
        if (document.getElementById("marca")) document.getElementById("marca").value = prod.marca || "";
        document.getElementById("categoria").value = prod.categoria;
        document.getElementById("proveedor").value = prod.proveedor;
        document.getElementById("precio").value = prod.precio;
        document.getElementById("cantidad").value = prod.cantidad;

        const tarjetaForm = formulario.closest(".card");
        if (tarjetaForm) {
            tarjetaForm.classList.remove("d-none");
        }

        if (btnGuardar) {
            btnGuardar.innerHTML = `Actualizar Producto`;
            btnGuardar.className = "btn btn-success fw-semibold w-100";
        }
        if (formTitulo) {
            formTitulo.innerHTML = `Modificar Producto (${codigo})`;
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.cancelarEdicion = function () {
        codigoEditando = null;
        document.getElementById("codigo").disabled = false;
        if (formulario) formulario.reset();
        
        if (btnGuardar) {
            btnGuardar.innerHTML = `Guardar Producto`;
            btnGuardar.className = "btn btn-primary fw-semibold w-100";
        }
        if (formTitulo) {
            formTitulo.innerHTML = `Registrar Producto`;
        }
    };

    window.eliminarProducto = async function (id) {
        if (confirm(`¿Estás seguro de eliminar este producto?`)) {
            try {
                const respuesta = await fetch(`${API_URL}/${id}`, {
                    method: "DELETE"
                });

                if (!respuesta.ok) throw new Error("No se pudo eliminar el producto");

                mostrarProductos();
                mostrarAlerta(`Producto eliminado correctamente.`, "danger");
            } catch (error) {
                console.error("Error al eliminar:", error);
                mostrarAlerta("Ocurrió un error al intentar eliminar el producto.", "danger");
            }
        }
    };

    // --- FUNCIÓN DE BÚSQUEDA LOCAL POR NOMBRE (CON 's') ---
    window.buscarProductosPorNombre = function() {
        const inputBuscar = document.getElementById("inputBusquedaNombre");
        if (!inputBuscar) return;
        
        const filtro = inputBuscar.value.toLowerCase().trim();

        if (filtro === "") {
            renderizarTabla(productos);
            return;
        }

        const resultados = productos.filter(p => 
            (p.nombre && p.nombre.toLowerCase().includes(filtro)) || 
            (p.marca && p.marca.toLowerCase().includes(filtro))
        );
        
        renderizarTabla(resultados);
    };

    window.limpiarBusqueda = function() {
        const inputBuscar = document.getElementById("inputBusquedaNombre");
        if (inputBuscar) inputBuscar.value = "";
        renderizarTabla(productos);
    };

    function mostrarAlerta(mensaje, tipo) {
        if (!alerta) return;
        alerta.innerHTML = `
            <div class="alert alert-${tipo} alert-dismissible fade show shadow-sm" role="alert">
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    }

    window.exportarExcel = function() {
        let tablaHtml = document.getElementById("tablaProductos");
        
        if (!tablaHtml || tablaHtml.rows.length === 0) {
            alert("No hay productos registrados para exportar.");
            return;
        }

        let csv = [];
        let filas = document.querySelectorAll("table tr");

        for (let i = 0; i < filas.length; i++) {
            let fila = [], cols = filas[i].querySelectorAll("td, th");

            for (let j = 0; j < cols.length - 1; j++) {
                let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, "").replace(/;/g, ",");
                fila.push('"' + data + '"');
            }
            csv.push(fila.join(";"));
        }

        let csvFile = new Blob(["\uFEFF" + csv.join("\n")], { type: "text/csv;charset=utf-8;" });
        let downloadLink = document.createElement("a");
        
        downloadLink.href = window.URL.createObjectURL(csvFile);
        downloadLink.setAttribute("download", "inventario_sena.csv");
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    mostrarProductos();
});