import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../database/prismaClient.js";

// ----------------------------------------
// LOGIN
// ----------------------------------------
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar en User o Company
    const account =
      (await prisma.user.findUnique({ where: { email } })) ||
      (await prisma.company.findUnique({ where: { email } }));

    if (!account) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Verificar contraseña
    const valid = await bcrypt.compare(password, account.password);
    if (!valid) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: account.id, email: account.email, role: account.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Determinar el tipo de respuesta según el rol
    if (account.role === "COMPANY") {
      return res.json({
        success: true,
        message: "Login exitoso",
        token,
        user: { 
          id: account.id, 
          nombreEmpresa: account.nombreEmpresa,
          email: account.email, 
          role: account.role 
        },
      });
    } else {
      return res.json({
        success: true,
        message: "Login exitoso",
        token,
        user: { id: account.id, email: account.email, role: account.role },
      });
    }
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: "Error interno del servidor" 
    });
  }
};

// ----------------------------------------
// REGISTRO DE USUARIO (versión estable)
// ----------------------------------------
export const registerUser = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      email,
      telefono,
      fechaNacimiento,
      ciudad,
      profesion,
      password,
    } = req.body;

    // Verificar si ya existe
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res
        .status(400)
        .json({ message: "El email ya está registrado" });

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Convertir fecha a DateTime si viene como string
    let fechaConvertida = null;
    if (fechaNacimiento) {
      fechaConvertida = new Date(fechaNacimiento);
      // Validar que la fecha sea válida
      if (isNaN(fechaConvertida.getTime())) {
        return res.status(400).json({
          message: "Fecha de nacimiento inválida. Usa formato YYYY-MM-DD"
        });
      }
    }

    // Guardar usuario completo
    const user = await prisma.user.create({
      data: {
        nombre,
        apellido,
        email,
        telefono,
        fechaNacimiento: fechaConvertida,
        ciudad,
        profesion,
        password: hashedPassword,
        role: "USER",
      },
    });

    // ✅ IMPORTANTE: No devolver el password
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: "✅ Usuario registrado con éxito",
      user: {
        ...userWithoutPassword,
        role: userWithoutPassword.role
      },
    });
  } catch (error) {
    console.error("❌ Error en registerUser:", error);
    console.error("❌ Stack trace:", error.stack);
    console.error("❌ Datos recibidos:", req.body);
    res.status(500).json({
      message: "Error en el registro",
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ----------------------------------------
// REGISTRO DE EMPRESA
// ----------------------------------------
export const registerCompany = async (req, res) => {
  try {
    const { 
      email,
      password,
      nombreEmpresa,
      rut,
      telefono,
      direccion,
      ciudad,
      sector,
      sitioWeb,
      tamano,
      tipoUsuario
    } = req.body;


    // Verificar si ya existe
    const existing = await prisma.company.findUnique({ where: { email } });
    if (existing)
      return res.status(409).json({ 
        success: false,
        error: "Email ya registrado" 
      });

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nueva empresa
    const newCompany = await prisma.company.create({
      data: {
        email,
        password: hashedPassword,
        role: "COMPANY",
        nombreEmpresa,
        rut: rut || null,
        telefono: telefono || null,
        direccion: direccion || null,
        ciudad: ciudad || null,
        sector: sector || null,
        sitioWeb: sitioWeb || null,
        tamano: tamano || null,
      },
    });

    // Generar token JWT
    const token = jwt.sign(
      { id: newCompany.id, email: newCompany.email, role: newCompany.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // No devolver el password
    const { password: _, ...companyWithoutPassword } = newCompany;

    return res.status(201).json({
      success: true,
      message: "Empresa registrada exitosamente",
      token,
      user: {
        id: companyWithoutPassword.id,
        nombreEmpresa: companyWithoutPassword.nombreEmpresa,
        email: companyWithoutPassword.email,
        role: companyWithoutPassword.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: "Error interno del servidor" 
    });
  }
};

// ----------------------------------------
// PERFIL - OBTENER DATOS SEGÚN ROL
// ----------------------------------------
export const getProfile = async (req, res) => {
  try {
    console.log("🚀 === INICIO OBTENER PERFIL ===");
    console.log("📋 Headers recibidos:", req.headers);
    console.log("🔑 Token de autorización:", req.headers.authorization);
    console.log("👤 Usuario del token:", req.user);

    const { id, role } = req.user; // viene del middleware requireAuth

    console.log("✅ Usuario validado:", { id, role });

    if (role === "USER") {
      console.log("👤 Obteniendo perfil de usuario...");
      const user = await prisma.user.findUnique({ 
        where: { id },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          telefono: true,
          fechaNacimiento: true,
          ciudad: true,
          profesion: true,
          biografia: true,
          experiencia: true,
          educacion: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });
     
      if (!user) {
        console.warn("❌ Usuario no encontrado:", id);
        return res.status(404).json({ 
          success: false,
          message: "Usuario no encontrado" 
        });
      }

      console.log("✅ Usuario encontrado:", user);

      // ✅ Convertir fechaNacimiento a formato YYYY-MM-DD para el input date
      if (user.fechaNacimiento) {
        user.fechaNacimiento = user.fechaNacimiento
          .toISOString()
          .split('T')[0];
      }

      console.log("🏁 === FIN OBTENER PERFIL USUARIO ===");
      return res.status(200).json({
        success: true,
        data: user
      });
    }

    if (role === "COMPANY") {
      console.log("🏢 Obteniendo perfil de empresa...");
      const company = await prisma.company.findUnique({ where: { id } });
     
      if (!company) {
        console.warn("❌ Empresa no encontrada:", id);
        return res.status(404).json({ 
          success: false,
          error: "Empresa no encontrada" 
        });
      }

      console.log("✅ Empresa encontrada:", company);

      // No devolver el password
      const { password, ...companyWithoutPassword } = company;
      console.log("🏁 === FIN OBTENER PERFIL EMPRESA ===");
      return res.status(200).json({
        success: true,
        data: {
          id: companyWithoutPassword.id,
          nombreEmpresa: companyWithoutPassword.nombreEmpresa,
          rut: companyWithoutPassword.rut,
          email: companyWithoutPassword.email,
          telefono: companyWithoutPassword.telefono,
          direccion: companyWithoutPassword.direccion,
          ciudad: companyWithoutPassword.ciudad,
          sector: companyWithoutPassword.sector,
          sitioWeb: companyWithoutPassword.sitioWeb,
          tamano: companyWithoutPassword.tamano,
          descripcion: companyWithoutPassword.descripcion,
          logoUrl: companyWithoutPassword.logoUrl,
          mision: companyWithoutPassword.mision, // 🆕
          vision: companyWithoutPassword.vision, // 🆕
          redesSociales: companyWithoutPassword.redesSociales, // 🆕
          empleados: companyWithoutPassword.empleados, // 🆕
          anioFundacion: companyWithoutPassword.anioFundacion, // 🆕
          role: companyWithoutPassword.role,
          createdAt: companyWithoutPassword.createdAt,
          updatedAt: companyWithoutPassword.updatedAt
        }
      });
    }

    // Si no es ni USER ni COMPANY
    console.warn("❌ Rol no válido:", role);
    return res.status(400).json({ 
      success: false,
      message: "Rol no válido" 
    });

  } catch (error) {
    console.error("❌ === ERROR OBTENER PERFIL ===");
    console.error("💥 Error completo:", error);
    console.error("📝 Mensaje de error:", error.message);
    console.error("🏷️ Código de error:", error.code);
    console.error("📊 Stack trace:", error.stack);
    console.error("🏁 === FIN ERROR ===");

    return res.status(500).json({ 
      success: false,
      error: "Error interno del servidor",
      details: process.env.NODE_ENV === 'development' ? error.message : "Algo salió mal al obtener el perfil"
    });
  }
};

// ----------------------------------------
// PERFIL - ACTUALIZAR DATOS SEGÚN ROL
// ----------------------------------------
export const updateProfile = async (req, res) => {
  try {
    const { id, role } = req.user;
    
    if (role === "USER") {
      console.log("🚀 === INICIO ACTUALIZAR PERFIL USUARIO ===");
      console.log("📋 Headers recibidos:", req.headers);
      console.log("🔑 Token de autorización:", req.headers.authorization);
      console.log("👤 Usuario del token:", req.user);
      console.log("📦 Datos del body:", req.body);

      // Procesar datos del formulario
      const {
        nombre,
        apellido,
        telefono,
        fechaNacimiento,
        ciudad,
        profesion,
        biografia,
        experiencia,
        educacion
      } = req.body;

      console.log("✅ Datos extraídos:", { nombre, apellido, telefono, fechaNacimiento, ciudad, profesion, biografia, experiencia, educacion });

      // Preparar datos para actualización
      const updateData = {};
      
      if (nombre !== undefined) updateData.nombre = nombre;
      if (apellido !== undefined) updateData.apellido = apellido;
      if (telefono !== undefined) updateData.telefono = telefono;
      if (ciudad !== undefined) updateData.ciudad = ciudad;
      if (profesion !== undefined) updateData.profesion = profesion;
      if (biografia !== undefined) updateData.biografia = biografia;
      if (experiencia !== undefined) updateData.experiencia = experiencia;
      if (educacion !== undefined) updateData.educacion = educacion;

      // Manejar fechaNacimiento
      if (fechaNacimiento !== undefined) {
        if (fechaNacimiento === null || fechaNacimiento === '') {
          updateData.fechaNacimiento = null;
        } else {
          const fecha = new Date(fechaNacimiento);
          if (isNaN(fecha.getTime())) {
            return res.status(400).json({ message: "Fecha de nacimiento inválida" });
          }
          updateData.fechaNacimiento = fecha;
        }
      }

      console.log("📝 Datos para actualizar:", updateData);

      const updated = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          telefono: true,
          fechaNacimiento: true,
          ciudad: true,
          profesion: true,
          biografia: true,
          experiencia: true,
          educacion: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // Convertir fecha para el frontend
      if (updated.fechaNacimiento) {
        updated.fechaNacimiento = updated.fechaNacimiento.toISOString().split('T')[0];
      }

      console.log("✅ Usuario actualizado:", updated);
      console.log("🏁 === FIN ACTUALIZAR PERFIL USUARIO ===");

      return res.status(200).json({
        success: true,
        message: "Perfil actualizado correctamente",
        data: updated
      });
    }

    if (role === "COMPANY") {
      console.log("🚀 === INICIO ACTUALIZAR PERFIL EMPRESA ===");
      console.log("📋 Headers recibidos:", req.headers);
      console.log("🔑 Token de autorización:", req.headers.authorization);
      console.log("👤 Usuario del token:", req.user);
      console.log("📦 Datos del body:", req.body);

      const {
        nombreEmpresa,
        rut,
        telefono,
        direccion,
        ciudad,
        sector,
        sitioWeb,
        tamano,
        descripcion,
        logoUrl,
        mision,
        vision,
        redesSociales,
        empleados,
        anioFundacion
      } = req.body;

      console.log("✅ Datos extraídos:", { nombreEmpresa, rut, telefono, direccion, ciudad, sector, sitioWeb, tamano, descripcion, logoUrl, mision, vision, redesSociales, empleados, anioFundacion });
      
      // Preparar datos para actualización
      const updateData = {};
      
      if (nombreEmpresa !== undefined) updateData.nombreEmpresa = nombreEmpresa;
      if (rut !== undefined) updateData.rut = rut;
      if (telefono !== undefined) updateData.telefono = telefono;
      if (direccion !== undefined) updateData.direccion = direccion;
      if (ciudad !== undefined) updateData.ciudad = ciudad;
      if (sector !== undefined) updateData.sector = sector;
      if (sitioWeb !== undefined) updateData.sitioWeb = sitioWeb;
      if (tamano !== undefined) updateData.tamano = tamano;
      if (descripcion !== undefined) updateData.descripcion = descripcion;
      if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
      if (mision !== undefined) updateData.mision = mision;
      if (vision !== undefined) updateData.vision = vision;
      if (redesSociales !== undefined) updateData.redesSociales = redesSociales;
      if (empleados !== undefined) updateData.empleados = parseInt(empleados);
      if (anioFundacion !== undefined) updateData.anioFundacion = parseInt(anioFundacion);

      console.log("📝 Datos para actualizar:", updateData);

      const updated = await prisma.company.update({
        where: { id },
        data: updateData
      });

      console.log("✅ Empresa actualizada:", updated);

      // No devolver el password
      const { password, ...updatedWithoutPassword } = updated;

      console.log("🏁 === FIN ACTUALIZAR PERFIL EMPRESA ===");

      return res.status(200).json({
        success: true,
        message: "Perfil actualizado exitosamente",
        data: {
          id: updatedWithoutPassword.id,
          nombreEmpresa: updatedWithoutPassword.nombreEmpresa,
          rut: updatedWithoutPassword.rut,
          email: updatedWithoutPassword.email,
          telefono: updatedWithoutPassword.telefono,
          direccion: updatedWithoutPassword.direccion,
          ciudad: updatedWithoutPassword.ciudad,
          sector: updatedWithoutPassword.sector,
          sitioWeb: updatedWithoutPassword.sitioWeb,
          tamano: updatedWithoutPassword.tamano,
          descripcion: updatedWithoutPassword.descripcion,
          logoUrl: updatedWithoutPassword.logoUrl,
          mision: updatedWithoutPassword.mision,
          vision: updatedWithoutPassword.vision,
          redesSociales: updatedWithoutPassword.redesSociales,
          empleados: updatedWithoutPassword.empleados,
          anioFundacion: updatedWithoutPassword.anioFundacion,
          role: updatedWithoutPassword.role,
          createdAt: updatedWithoutPassword.createdAt,
          updatedAt: updatedWithoutPassword.updatedAt
        }
      });
    }

    // Si no es ni USER ni COMPANY
    console.warn("❌ Rol no válido:", role);
    return res.status(400).json({ 
      success: false,
      message: "Rol no válido" 
    });

  } catch (error) {
    console.error("❌ === ERROR ACTUALIZAR PERFIL ===");
    console.error("💥 Error completo:", error);
    console.error("📝 Mensaje de error:", error.message);
    console.error("🏷️ Código de error:", error.code);
    console.error("📊 Stack trace:", error.stack);
    console.error("🏁 === FIN ERROR ===");

    return res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      details: process.env.NODE_ENV === 'development' ? error.message : "Algo salió mal al actualizar el perfil"
    });
  }
};
